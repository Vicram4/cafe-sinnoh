from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.contact_message import ContactMessage
from app.models.product import Product
from app.models.reward import Reward
from app.models.user import User
from app.seed import seed_demo
from app.seed.reset_demo import DemoModeDisabled, reset
from tests.conftest import API


def _count(db: Session, model, *where) -> int:
    return db.scalar(select(func.count()).select_from(model).where(*where))


def _login(client: TestClient, account: dict) -> str:
    response = client.post(f"{API}/auth/login", data={"username": account["email"], "password": account["password"]})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_reset_refuses_to_run_without_demo_mode(db: Session, make_user) -> None:
    make_user("persona-real@example.com")
    # Cierra la transacción abierta por make_user: si la protección fallara,
    # el TRUNCATE esperaría para siempre a su bloqueo y el test se colgaría
    # en vez de fallar.
    db.commit()

    with pytest.raises(DemoModeDisabled):
        reset()

    assert _count(db, User) == 1


def test_reset_wipes_everything_and_restores_the_demo(
    client: TestClient, db: Session, make_user, _upload_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "demo_mode", True)
    make_user("visitante@example.com")
    db.add(ContactMessage(name="Spam", email="spam@example.com", message="Compra ya"))
    db.commit()
    cvs = _upload_dir / "cvs"
    cvs.mkdir()
    (cvs / f"{'a' * 32}.pdf").write_bytes(b"%PDF-")

    reset()

    db.expire_all()
    assert _count(db, User, User.email == "visitante@example.com") == 0
    assert _count(db, ContactMessage, ContactMessage.name == "Spam") == 0
    assert list(cvs.iterdir()) == []
    assert _count(db, Product) == 12
    assert _count(db, Reward) == 3
    assert _count(db, User) == 2


def test_demo_accounts_work_and_have_sample_data(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "demo_mode", True)
    reset()

    customer = {"Authorization": f"Bearer {_login(client, seed_demo.DEMO_CUSTOMER)}"}
    admin = {"Authorization": f"Bearer {_login(client, seed_demo.DEMO_ADMIN)}"}

    orders = client.get(f"{API}/orders", headers=customer).json()
    assert {order["status"] for order in orders} == {"COMPLETED", "CONFIRMED"}
    assert client.get(f"{API}/points/me", headers=customer).json()["balance"] > 0
    assert client.get(f"{API}/auth/me", headers=admin).json()["role"] == "ADMIN"
    assert client.get(f"{API}/reviews/admin/all", headers=admin).status_code == 200
    assert len(client.get(f"{API}/careers/applications", headers=admin).json()) == 1


def test_seeding_the_demo_twice_does_not_duplicate_it(db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "demo_mode", True)
    reset()

    seed_demo.seed()

    assert _count(db, User) == 2
