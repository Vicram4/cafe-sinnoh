from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.main import app
from app.models.login_attempt import LoginAttempt
from app.models.user import User
from tests.conftest import API, PASSWORD

LOGIN = f"{API}/auth/login"


def _login(client: TestClient, email: str, password: str):
    return client.post(LOGIN, data={"username": email, "password": password})


def _fail(client: TestClient, email: str, times: int) -> None:
    for _ in range(times):
        assert _login(client, email, "contraseña-mala").status_code == 401


def test_account_is_blocked_after_too_many_failures_even_with_the_right_password(
    client: TestClient, user: User
) -> None:
    _fail(client, user.email, 5)

    response = _login(client, user.email, PASSWORD)

    assert response.status_code == 429
    assert "Demasiados intentos fallidos" in response.json()["detail"]
    retry_after = int(response.headers["retry-after"])
    assert 0 < retry_after <= 15 * 60


def test_failures_below_the_limit_do_not_block(client: TestClient, user: User) -> None:
    _fail(client, user.email, 4)

    assert _login(client, user.email, PASSWORD).status_code == 200


def test_successful_login_resets_the_counter(client: TestClient, user: User) -> None:
    _fail(client, user.email, 4)
    assert _login(client, user.email, PASSWORD).status_code == 200

    _fail(client, user.email, 4)

    assert _login(client, user.email, PASSWORD).status_code == 200


def test_blocking_from_one_ip_does_not_lock_the_owner_out_from_another(client: TestClient, user: User) -> None:
    """Si el límite fuera solo por cuenta, cualquiera podría bloquear la cuenta de otra persona."""
    _fail(client, user.email, 5)

    with TestClient(app, client=("203.0.113.7", 50000)) as other_client:
        assert _login(other_client, user.email, PASSWORD).status_code == 200


def test_ip_is_blocked_after_failing_on_many_different_accounts(
    client: TestClient, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "login_max_failures_per_ip", 6)
    for number in range(6):
        _fail(client, f"no-existe-{number}@example.com", 1)

    assert _login(client, user.email, PASSWORD).status_code == 429


def test_block_expires_when_the_failures_leave_the_window(client: TestClient, db: Session, user: User) -> None:
    _fail(client, user.email, 5)
    assert _login(client, user.email, PASSWORD).status_code == 429

    db.execute(update(LoginAttempt).values(created_at=LoginAttempt.created_at - timedelta(minutes=16)))
    db.commit()

    assert _login(client, user.email, PASSWORD).status_code == 200


def test_email_is_never_stored_in_plain_text(client: TestClient, db: Session) -> None:
    _fail(client, "Alguien@Example.com", 1)

    stored = db.scalars(select(LoginAttempt.identifier_hash)).one()

    assert len(stored) == 64
    assert "alguien" not in stored.lower()


def test_old_attempts_are_deleted_on_the_next_failure(client: TestClient, db: Session) -> None:
    _fail(client, "a@example.com", 3)
    db.execute(update(LoginAttempt).values(created_at=LoginAttempt.created_at - timedelta(minutes=16)))
    db.commit()

    _fail(client, "b@example.com", 1)

    assert db.scalar(select(func.count()).select_from(LoginAttempt)) == 1
