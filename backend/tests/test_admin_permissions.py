from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from app.models.product import Product
from app.models.user import User
from tests.conftest import API, auth_headers

# Todos los endpoints solo-admin. Los ids no necesitan existir: require_admin
# se resuelve antes de buscar nada, así que la respuesta es 401/403 igual.
ADMIN_ENDPOINTS = [
    ("GET", "/admin/stats"),
    ("GET", "/admin/users"),
    ("PATCH", "/admin/users/1"),
    ("GET", "/orders/admin/all"),
    ("PATCH", "/orders/1/status"),
    ("POST", "/products"),
    ("PATCH", "/products/1"),
    ("DELETE", "/products/1"),
    ("GET", "/reviews/admin/all"),
    ("PATCH", "/reviews/1/moderate"),
    ("GET", "/careers/applications"),
    ("PATCH", "/careers/applications/1/status"),
    ("GET", "/careers/applications/1/cv"),
    ("GET", "/contact"),
    ("PATCH", "/contact/1"),
]


@pytest.mark.parametrize(("method", "path"), ADMIN_ENDPOINTS)
def test_admin_endpoints_reject_regular_users(
    client: TestClient, user_headers: dict, method: str, path: str
) -> None:
    response = client.request(method, f"{API}{path}", headers=user_headers)

    assert response.status_code == 403


@pytest.mark.parametrize(("method", "path"), ADMIN_ENDPOINTS)
def test_admin_endpoints_reject_anonymous_requests(client: TestClient, method: str, path: str) -> None:
    response = client.request(method, f"{API}{path}")

    assert response.status_code == 401


def test_admin_can_access_admin_endpoints(client: TestClient, admin_headers: dict) -> None:
    assert client.get(f"{API}/admin/stats", headers=admin_headers).status_code == 200
    assert client.get(f"{API}/admin/users", headers=admin_headers).status_code == 200


def test_role_is_read_from_database_not_from_token(
    client: TestClient, admin: User, user: User, admin_headers: dict
) -> None:
    """Un USER ascendido a ADMIN obtiene acceso con el mismo token que ya tenía."""
    headers = auth_headers(user)
    assert client.get(f"{API}/admin/stats", headers=headers).status_code == 403

    client.patch(f"{API}/admin/users/{user.id}", json={"role": "ADMIN"}, headers=admin_headers)

    assert client.get(f"{API}/admin/stats", headers=headers).status_code == 200


@pytest.mark.parametrize("change", [{"role": "USER"}, {"is_active": False}])
def test_admin_cannot_change_own_role_or_deactivate_self(
    client: TestClient, admin: User, admin_headers: dict, change: dict
) -> None:
    response = client.patch(f"{API}/admin/users/{admin.id}", json=change, headers=admin_headers)

    assert response.status_code == 400
    assert client.get(f"{API}/auth/me", headers=admin_headers).json()["role"] == "ADMIN"


def test_admin_can_deactivate_another_user_and_it_takes_effect_immediately(
    client: TestClient, user: User, admin_headers: dict
) -> None:
    user_headers = auth_headers(user)

    response = client.patch(f"{API}/admin/users/{user.id}", json={"is_active": False}, headers=admin_headers)

    assert response.status_code == 200
    assert client.get(f"{API}/auth/me", headers=user_headers).status_code == 403


def test_product_without_orders_can_be_deleted(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.delete(f"{API}/products/{product.id}", headers=admin_headers)

    assert response.status_code == 204


def test_product_with_orders_cannot_be_deleted(
    client: TestClient, admin_headers: dict, user_headers: dict, product: Product, place_order: Callable
) -> None:
    place_order(user_headers)

    response = client.delete(f"{API}/products/{product.id}", headers=admin_headers)

    assert response.status_code == 409
    assert client.get(f"{API}/products/{product.slug}").status_code == 200
