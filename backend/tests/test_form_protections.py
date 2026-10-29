from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.main import app
from app.models.contact_message import ContactMessage
from app.models.job_application import JobApplication
from app.models.rate_limit_event import RateLimitEvent
from app.models.user import User
from tests.conftest import API

CONTACT = {"name": "Ana", "email": "ana@example.com", "message": "Hola"}
APPLICATION = {
    "full_name": "Ana Prueba",
    "email": "ana@example.com",
    "phone": "600000000",
    "position": "BARISTA",
    "experience": "Dos años.",
}


def _register(client: TestClient, **overrides):
    payload = {"email": "nueva@example.com", "password": "una-clave-segura", "full_name": "Nueva Clienta"} | overrides
    return client.post(f"{API}/auth/register", json=payload)


def _count(db: Session, model) -> int:
    return db.scalar(select(func.count()).select_from(model))


# --- Contraseñas ---


def test_password_shorter_than_8_characters_is_rejected(client: TestClient) -> None:
    assert _register(client, password="corta12").status_code == 422


@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("password123", "demasiado común"),
        ("Contraseña", "demasiado común"),  # sin distinguir mayúsculas
        ("aaaaaaaaaa", "mismos caracteres"),
        ("nueva-2026!", "tu email"),  # contiene "nueva", la parte local del email
    ],
)
def test_weak_passwords_are_rejected_with_a_clear_message(
    client: TestClient, db: Session, password: str, message: str
) -> None:
    response = _register(client, password=password)

    assert response.status_code == 400
    assert message in response.json()["detail"]
    assert _count(db, User) == 0


def test_strong_password_is_accepted(client: TestClient) -> None:
    assert _register(client).status_code == 201


def test_overlong_fields_are_rejected_instead_of_crashing(client: TestClient) -> None:
    """Antes llegaban a PostgreSQL y provocaban un error 500."""
    assert _register(client, full_name="x" * 300).status_code == 422
    assert _register(client, phone="6" * 40).status_code == 422
    assert _register(client, password="x" * 129).status_code == 422


# --- Campo trampa (honeypot) ---


def test_honeypot_blocks_bot_registrations(client: TestClient, db: Session) -> None:
    response = _register(client, website="http://spam.example")

    assert response.status_code == 400
    assert _count(db, User) == 0


def test_honeypot_blocks_bot_contact_messages(client: TestClient, db: Session) -> None:
    response = client.post(f"{API}/contact", json=CONTACT | {"website": "http://spam.example"})

    assert response.status_code == 400
    assert _count(db, ContactMessage) == 0


def test_honeypot_blocks_bot_job_applications(client: TestClient, db: Session) -> None:
    response = client.post(f"{API}/careers/applications", data=APPLICATION | {"website": "http://spam.example"})

    assert response.status_code == 400
    assert _count(db, JobApplication) == 0


def test_empty_honeypot_is_accepted(client: TestClient) -> None:
    assert client.post(f"{API}/contact", json=CONTACT | {"website": ""}).status_code == 201


# --- Límite de envíos por IP ---


def test_contact_form_is_limited_per_ip(client: TestClient) -> None:
    for _ in range(5):
        assert client.post(f"{API}/contact", json=CONTACT).status_code == 201

    response = client.post(f"{API}/contact", json=CONTACT)

    assert response.status_code == 429
    assert "demasiadas solicitudes" in response.json()["detail"]
    assert 0 < int(response.headers["retry-after"]) <= 60 * 60


def test_limit_is_per_ip_and_per_form(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "form_max_submissions", 1)
    assert client.post(f"{API}/contact", json=CONTACT).status_code == 201
    assert client.post(f"{API}/contact", json=CONTACT).status_code == 429

    # Otro formulario desde la misma IP, y el mismo formulario desde otra IP.
    assert _register(client).status_code == 201
    with TestClient(app, client=("203.0.113.9", 50000)) as other:
        assert other.post(f"{API}/contact", json=CONTACT).status_code == 201


def test_registration_and_job_applications_are_limited_too(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "form_max_submissions", 1)
    assert _register(client).status_code == 201
    assert _register(client, email="otra@example.com").status_code == 429
    assert client.post(f"{API}/careers/applications", data=APPLICATION).status_code == 201
    assert client.post(f"{API}/careers/applications", data=APPLICATION).status_code == 429


def test_limit_expires_after_the_window(client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "form_max_submissions", 1)
    assert client.post(f"{API}/contact", json=CONTACT).status_code == 201
    assert client.post(f"{API}/contact", json=CONTACT).status_code == 429

    db.execute(update(RateLimitEvent).values(created_at=RateLimitEvent.created_at - timedelta(minutes=61)))
    db.commit()

    assert client.post(f"{API}/contact", json=CONTACT).status_code == 201
    # Los registros caducados se han limpiado: solo queda el envío nuevo.
    assert _count(db, RateLimitEvent) == 1
