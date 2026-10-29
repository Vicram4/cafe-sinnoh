from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from tests.conftest import API, PASSWORD, auth_headers


def test_register_creates_user_without_exposing_password(client: TestClient) -> None:
    response = client.post(
        f"{API}/auth/register",
        json={"email": "nueva@example.com", "password": "secreta123", "full_name": "Nueva Clienta"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "nueva@example.com"
    assert body["role"] == "USER"
    assert body["is_active"] is True
    assert "password" not in body
    assert "password_hash" not in body


def test_register_rejects_duplicate_email(client: TestClient, user: User) -> None:
    response = client.post(
        f"{API}/auth/register",
        json={"email": user.email, "password": "otra123", "full_name": "Duplicada"},
    )

    assert response.status_code == 409


def test_login_returns_token_that_identifies_the_user(client: TestClient, user: User) -> None:
    login = client.post(f"{API}/auth/login", data={"username": user.email, "password": PASSWORD})
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert me.status_code == 200
    assert me.json()["email"] == user.email


def test_login_gives_same_error_for_wrong_password_and_unknown_email(client: TestClient, user: User) -> None:
    """El mismo mensaje en ambos casos para no revelar qué emails están registrados."""
    wrong_password = client.post(f"{API}/auth/login", data={"username": user.email, "password": "mala"})
    unknown_email = client.post(f"{API}/auth/login", data={"username": "nadie@example.com", "password": "mala"})

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]


def test_me_requires_a_valid_token(client: TestClient) -> None:
    assert client.get(f"{API}/auth/me").status_code == 401
    assert client.get(f"{API}/auth/me", headers={"Authorization": "Bearer no-es-un-jwt"}).status_code == 401


def test_deactivated_user_is_rejected_even_with_a_previously_issued_token(
    client: TestClient, db: Session, user: User
) -> None:
    headers = auth_headers(user)
    assert client.get(f"{API}/auth/me", headers=headers).status_code == 200

    user.is_active = False
    db.commit()

    assert client.get(f"{API}/auth/me", headers=headers).status_code == 403
    login = client.post(f"{API}/auth/login", data={"username": user.email, "password": PASSWORD})
    assert login.status_code == 403
