from collections.abc import Callable
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from tests.conftest import API, auth_headers


def _order_payload(product_id: int, pickup_at: str, quantity: int = 1, **extra) -> dict:
    return {"items": [{"product_id": product_id, "quantity": quantity, **extra}], "pickup_at": pickup_at}


def test_order_total_is_computed_from_database_prices(
    client: TestClient, user_headers: dict, product: Product, pickup_at: str
) -> None:
    """Aunque el cliente envíe un precio, el servidor lo ignora y usa el de la BD."""
    payload = _order_payload(product.id, pickup_at, quantity=2, unit_price_cents=1)

    response = client.post(f"{API}/orders", json=payload, headers=user_headers)

    assert response.status_code == 201
    order = response.json()
    assert order["status"] == "PENDING"
    assert order["subtotal_cents"] == order["total_cents"] == 900
    assert order["items"][0]["unit_price_cents"] == 450
    assert order["items"][0]["product_name"] == product.name


def test_order_keeps_price_snapshot_after_product_changes(
    client: TestClient, db: Session, user_headers: dict, product: Product, place_order: Callable
) -> None:
    place_order(user_headers, quantity=1)

    product.price_cents = 999
    product.name = "Nombre nuevo"
    db.commit()

    item = client.get(f"{API}/orders", headers=user_headers).json()[0]["items"][0]
    assert item["unit_price_cents"] == 450
    assert item["product_name"] == "Café de prueba"


def test_order_requires_authentication(client: TestClient, product: Product, pickup_at: str) -> None:
    assert client.post(f"{API}/orders", json=_order_payload(product.id, pickup_at)).status_code == 401


def test_order_rejects_pickup_too_soon(client: TestClient, user_headers: dict, product: Product) -> None:
    soon = (datetime.now().astimezone() + timedelta(minutes=5)).isoformat()

    response = client.post(f"{API}/orders", json=_order_payload(product.id, soon), headers=user_headers)

    assert response.status_code == 400
    assert "minutos" in response.json()["detail"]


def test_order_rejects_pickup_outside_opening_hours(
    client: TestClient, user_headers: dict, product: Product
) -> None:
    tomorrow_night = (datetime.now().astimezone() + timedelta(days=1)).replace(hour=23, minute=0)

    response = client.post(
        f"{API}/orders", json=_order_payload(product.id, tomorrow_night.isoformat()), headers=user_headers
    )

    assert response.status_code == 400
    assert "entre las" in response.json()["detail"]


def test_order_rejects_pickup_without_timezone(client: TestClient, user_headers: dict, product: Product) -> None:
    naive = (datetime.now() + timedelta(days=1)).replace(hour=12, minute=0, microsecond=0).isoformat()

    response = client.post(f"{API}/orders", json=_order_payload(product.id, naive), headers=user_headers)

    assert response.status_code == 400
    assert "zona horaria" in response.json()["detail"]


def test_order_rejects_unavailable_product(
    client: TestClient, db: Session, user_headers: dict, product: Product, pickup_at: str
) -> None:
    product.is_available = False
    db.commit()

    response = client.post(f"{API}/orders", json=_order_payload(product.id, pickup_at), headers=user_headers)

    assert response.status_code == 400
    assert "no está disponible" in response.json()["detail"]


def test_order_rejects_unknown_product(client: TestClient, user_headers: dict, pickup_at: str) -> None:
    response = client.post(f"{API}/orders", json=_order_payload(99999, pickup_at), headers=user_headers)

    assert response.status_code == 400


@pytest.mark.parametrize("items", [[], [{"product_id": 1, "quantity": 0}]])
def test_order_rejects_empty_items_or_zero_quantity(
    client: TestClient, user_headers: dict, pickup_at: str, items: list
) -> None:
    response = client.post(f"{API}/orders", json={"items": items, "pickup_at": pickup_at}, headers=user_headers)

    assert response.status_code == 422


def test_users_only_see_their_own_orders(
    client: TestClient, make_user: Callable[..., User], user_headers: dict, place_order: Callable
) -> None:
    mine = place_order(user_headers)
    other_headers = auth_headers(make_user("otra@example.com"))
    place_order(other_headers)

    orders = client.get(f"{API}/orders", headers=user_headers).json()

    assert [order["id"] for order in orders] == [mine["id"]]


def test_order_goes_through_the_full_state_machine(
    client: TestClient, user_headers: dict, place_order: Callable, advance_order: Callable
) -> None:
    order = place_order(user_headers)

    advance_order(order["id"], "CONFIRMED", "PREPARING", "READY", "COMPLETED")

    assert client.get(f"{API}/orders", headers=user_headers).json()[0]["status"] == "COMPLETED"


@pytest.mark.parametrize(
    ("previous_steps", "invalid_status"),
    [
        ([], "COMPLETED"),  # no se puede saltar pasos
        (["CONFIRMED", "PREPARING"], "CANCELLED"),  # ya en preparación no se cancela
        (["CONFIRMED", "PREPARING", "READY", "COMPLETED"], "CANCELLED"),  # estado final
        (["CANCELLED"], "CONFIRMED"),  # estado final
    ],
)
def test_invalid_status_transitions_are_rejected(
    client: TestClient,
    user_headers: dict,
    admin_headers: dict,
    place_order: Callable,
    advance_order: Callable,
    previous_steps: list[str],
    invalid_status: str,
) -> None:
    order = place_order(user_headers)
    advance_order(order["id"], *previous_steps)

    response = client.patch(
        f"{API}/orders/{order['id']}/status", json={"status": invalid_status}, headers=admin_headers
    )

    assert response.status_code == 400


@pytest.mark.parametrize(("hour", "minute", "accepted"), [(8, 30, True), (19, 45, True), (7, 59, False), (20, 30, False)])
def test_opening_hours_use_the_shop_timezone_not_the_server_one(
    client: TestClient, user_headers: dict, product: Product, hour: int, minute: int, accepted: bool
) -> None:
    """El horario es el de España aunque el servidor esté en UTC (como en
    Docker o en la CI): antes, las 8:30 de Madrid se rechazaban."""
    madrid = ZoneInfo("Europe/Madrid")
    pickup = (datetime.now(madrid) + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)

    response = client.post(f"{API}/orders", json=_order_payload(product.id, pickup.isoformat()), headers=user_headers)

    assert (response.status_code == 201) is accepted, response.text
