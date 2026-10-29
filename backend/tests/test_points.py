from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus
from app.models.reward import Reward
from app.services.orders import transition_order_status
from tests.conftest import API


def _balance(client: TestClient, headers: dict) -> int:
    return client.get(f"{API}/points/me", headers=headers).json()["balance"]


def _completed_order(place_order: Callable, advance_order: Callable, headers: dict, quantity: int) -> dict:
    order = place_order(headers, quantity=quantity)
    advance_order(order["id"], "CONFIRMED", "PREPARING", "READY", "COMPLETED")
    return order


def test_new_user_has_zero_points(client: TestClient, user_headers: dict) -> None:
    summary = client.get(f"{API}/points/me", headers=user_headers).json()

    assert summary == {"balance": 0, "transactions": []}


def test_completing_an_order_awards_one_point_per_euro_rounded_down(
    client: TestClient, user_headers: dict, place_order: Callable, advance_order: Callable
) -> None:
    # 3 x 4,50 € = 13,50 € -> 13 puntos
    order = _completed_order(place_order, advance_order, user_headers, quantity=3)

    summary = client.get(f"{API}/points/me", headers=user_headers).json()

    assert summary["balance"] == 13
    assert len(summary["transactions"]) == 1
    assert summary["transactions"][0]["type"] == "EARN"
    assert summary["transactions"][0]["order_id"] == order["id"]


def test_no_points_until_the_order_is_completed(
    client: TestClient, user_headers: dict, place_order: Callable, advance_order: Callable
) -> None:
    order = place_order(user_headers, quantity=3)
    advance_order(order["id"], "CONFIRMED", "PREPARING", "READY")

    assert _balance(client, user_headers) == 0


def test_points_are_never_awarded_twice_for_the_same_order(
    client: TestClient, db: Session, user_headers: dict, place_order: Callable, advance_order: Callable
) -> None:
    """La máquina de estados ya impide completar dos veces, así que aquí se
    fuerza el caso en el servicio para comprobar la protección points_awarded."""
    created = _completed_order(place_order, advance_order, user_headers, quantity=3)

    order = db.get(Order, created["id"])
    order.status = OrderStatus.READY
    db.commit()
    transition_order_status(db, order, OrderStatus.COMPLETED)

    assert _balance(client, user_headers) == 13


def test_redeeming_a_reward_subtracts_points_and_records_it(
    client: TestClient, user_headers: dict, reward: Reward, place_order: Callable, advance_order: Callable
) -> None:
    _completed_order(place_order, advance_order, user_headers, quantity=3)  # 13 puntos

    response = client.post(f"{API}/rewards/{reward.id}/redeem", headers=user_headers)

    assert response.status_code == 201
    assert response.json()["points"] == -5
    assert response.json()["type"] == "REDEEM"
    assert _balance(client, user_headers) == 8


def test_redeeming_without_enough_points_is_rejected(
    client: TestClient, user_headers: dict, reward: Reward
) -> None:
    response = client.post(f"{API}/rewards/{reward.id}/redeem", headers=user_headers)

    assert response.status_code == 400
    assert "Te faltan 5 puntos" in response.json()["detail"]
    assert _balance(client, user_headers) == 0


def test_inactive_reward_cannot_be_redeemed(
    client: TestClient,
    db: Session,
    user_headers: dict,
    reward: Reward,
    place_order: Callable,
    advance_order: Callable,
) -> None:
    _completed_order(place_order, advance_order, user_headers, quantity=3)
    reward.is_active = False
    db.commit()

    response = client.post(f"{API}/rewards/{reward.id}/redeem", headers=user_headers)

    assert response.status_code == 400
    assert _balance(client, user_headers) == 13
