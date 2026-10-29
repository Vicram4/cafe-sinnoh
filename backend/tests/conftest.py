"""Configuración común de los tests.

Los tests usan SIEMPRE una base de datos aparte (TEST_DATABASE_URL), nunca
la de desarrollo. Para garantizarlo, DATABASE_URL se sustituye ANTES de
importar nada más de la app: session.py, deps.py y Alembic leen la
configuración al importarse, así que nacen ya apuntando a la BD de test y
la de desarrollo ni siquiera llega a abrirse."""

import os
from collections.abc import Callable, Iterator
from datetime import datetime, timedelta
from pathlib import Path

import psycopg
import pytest
from psycopg import sql
from sqlalchemy.engine import make_url

from app.core.config import Settings, get_settings

_test_url = Settings().test_database_url
if not _test_url or not (make_url(_test_url).database or "").endswith("_test"):
    raise RuntimeError(
        "Define TEST_DATABASE_URL en backend/.env con una base de datos cuyo nombre "
        "termine en '_test'. Los tests vacían todas sus tablas."
    )
os.environ["DATABASE_URL"] = _test_url
get_settings.cache_clear()

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.security import create_access_token, hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.category import Category  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.reward import Reward  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402

BACKEND_DIR = Path(__file__).resolve().parents[1]
API = "/api/v1"
PASSWORD = "contraseña-de-test"


def _ensure_test_database_exists() -> None:
    url = make_url(_test_url)
    # CREATE DATABASE no puede ejecutarse dentro de una transacción ni
    # conectado a la propia BD que se crea: se usa la BD de mantenimiento
    # "postgres" en modo autocommit.
    with psycopg.connect(
        host=url.host,
        port=url.port,
        user=url.username,
        password=url.password,
        dbname="postgres",
        autocommit=True,
    ) as conn:
        exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (url.database,)).fetchone()
        if not exists:
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(url.database)))


@pytest.fixture(scope="session", autouse=True)
def _test_database() -> None:
    """Las tablas se crean con las migraciones reales (no con
    create_all): así los tests también comprueban que las migraciones
    funcionan desde una BD vacía."""
    _ensure_test_database_exists()
    command.upgrade(Config(str(BACKEND_DIR / "alembic.ini")), "head")


@pytest.fixture(autouse=True)
def _clean_database() -> Iterator[None]:
    """Cada test empieza con la BD vacía. TRUNCATE en vez de transacción
    con rollback: el código de la app hace commit() por su cuenta, y así
    no hay que adaptarlo a los tests."""
    yield
    tables = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def _upload_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Los CVs de los tests van a una carpeta temporal, nunca a backend/uploads."""
    monkeypatch.setattr(get_settings(), "upload_dir", tmp_path)
    return tmp_path


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def make_user(db: Session) -> Callable[..., User]:
    def _make_user(email: str, role: UserRole = UserRole.USER, is_active: bool = True) -> User:
        user = User(
            email=email,
            password_hash=hash_password(PASSWORD),
            full_name=email.split("@")[0].title(),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make_user


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.email)}"}


@pytest.fixture
def user(make_user: Callable[..., User]) -> User:
    return make_user("cliente@example.com")


@pytest.fixture
def admin(make_user: Callable[..., User]) -> User:
    return make_user("admin@example.com", role=UserRole.ADMIN)


@pytest.fixture
def user_headers(user: User) -> dict[str, str]:
    return auth_headers(user)


@pytest.fixture
def admin_headers(admin: User) -> dict[str, str]:
    return auth_headers(admin)


@pytest.fixture
def product(db: Session) -> Product:
    category = Category(slug="cafes", name="Cafés", sort_order=1)
    db.add(category)
    db.flush()
    product = Product(
        category_id=category.id,
        slug="cafe-de-prueba",
        name="Café de prueba",
        description="Producto creado por los tests.",
        price_cents=450,
        ingredients=["café"],
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def reward(db: Session) -> Reward:
    reward = Reward(name="Café gratis", description="Recompensa de test.", cost_points=5)
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@pytest.fixture
def pickup_at() -> str:
    """Mañana a las 12:00 en la hora local del servidor: siempre dentro
    del horario y con margen suficiente, sea cual sea la hora a la que
    se ejecuten los tests."""
    tomorrow = datetime.now().astimezone() + timedelta(days=1)
    return tomorrow.replace(hour=12, minute=0, second=0, microsecond=0).isoformat()


@pytest.fixture
def place_order(client: TestClient, product: Product, pickup_at: str) -> Callable[..., dict]:
    def _place_order(headers: dict[str, str], quantity: int = 1) -> dict:
        response = client.post(
            f"{API}/orders",
            json={"items": [{"product_id": product.id, "quantity": quantity}], "pickup_at": pickup_at},
            headers=headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _place_order


@pytest.fixture
def advance_order(client: TestClient, admin_headers: dict[str, str]) -> Callable[..., None]:
    """Lleva un pedido por la máquina de estados, paso a paso, como admin."""

    def _advance_order(order_id: int, *statuses: str) -> None:
        for status in statuses:
            response = client.patch(
                f"{API}/orders/{order_id}/status", json={"status": status}, headers=admin_headers
            )
            assert response.status_code == 200, response.text

    return _advance_order
