from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from tests.conftest import API, PASSWORD

REFRESH = f"{API}/auth/refresh"


def _login(client: TestClient, user: User):
    response = client.post(f"{API}/auth/login", data={"username": user.email, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return response


def _refresh_with(client: TestClient, token: str):
    """Envía un token concreto (y no el que tenga guardado el cliente), para
    poder simular que alguien reutiliza una copia antigua."""
    client.cookies.clear()
    return client.post(REFRESH, headers={"Cookie": f"refresh_token={token}"})


def _cookie_value(response) -> str:
    return response.cookies["refresh_token"]


def test_login_sets_a_protected_refresh_cookie(client: TestClient, user: User) -> None:
    set_cookie = _login(client, user).headers["set-cookie"].lower()

    assert "refresh_token=" in set_cookie
    assert "httponly" in set_cookie
    assert "samesite=strict" in set_cookie
    assert "path=/api/v1/auth" in set_cookie
    assert f"max-age={7 * 24 * 60 * 60}" in set_cookie


def test_cookie_is_secure_when_enabled(client: TestClient, user: User, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "refresh_cookie_secure", True)

    assert "secure" in _login(client, user).headers["set-cookie"].lower()


def test_refresh_gives_a_working_access_token_and_rotates_the_cookie(client: TestClient, user: User) -> None:
    first = _cookie_value(_login(client, user))

    response = _refresh_with(client, first)

    assert response.status_code == 200
    access = response.json()["access_token"]
    assert client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {access}"}).json()["email"] == user.email
    assert _cookie_value(response) != first


def test_refresh_without_cookie_is_rejected(client: TestClient) -> None:
    assert client.post(REFRESH).status_code == 401


def test_reusing_an_old_token_revokes_the_whole_session(client: TestClient, user: User) -> None:
    """Un token ya rotado solo puede reaparecer si alguien lo ha copiado."""
    stolen = _cookie_value(_login(client, user))
    newest = _cookie_value(_refresh_with(client, stolen))

    assert _refresh_with(client, stolen).status_code == 401
    # También cae la sesión legítima: hay que volver a iniciar sesión.
    assert _refresh_with(client, newest).status_code == 401


def test_logout_revokes_the_session_on_the_server(client: TestClient, user: User) -> None:
    token = _cookie_value(_login(client, user))

    response = client.post(f"{API}/auth/logout")

    assert response.status_code == 204
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert _refresh_with(client, token).status_code == 401


def test_expired_token_is_rejected(client: TestClient, db: Session, user: User) -> None:
    token = _cookie_value(_login(client, user))
    db.execute(update(RefreshToken).values(expires_at=RefreshToken.expires_at - timedelta(days=8)))
    db.commit()

    assert _refresh_with(client, token).status_code == 401


def test_deactivated_user_cannot_refresh(client: TestClient, db: Session, user: User) -> None:
    token = _cookie_value(_login(client, user))
    user.is_active = False
    db.commit()

    response = _refresh_with(client, token)

    assert response.status_code == 403
    assert "max-age=0" in response.headers["set-cookie"].lower()


def test_only_a_hash_of_the_token_is_stored(client: TestClient, db: Session, user: User) -> None:
    token = _cookie_value(_login(client, user))

    stored = db.scalars(select(RefreshToken.token_hash)).one()

    assert stored != token
    assert len(stored) == 64
