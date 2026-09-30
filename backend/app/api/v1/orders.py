from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
from app.services.orders import OrderValidationError, create_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: OrderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Order:
    try:
        return create_order(db, user_id=current_user.id, payload=payload)
    except OrderValidationError as error:
        # Toda la lógica de negocio vive en services/orders.py, sin
        # saber nada de HTTP; aquí, y solo aquí, la traducimos a un
        # código de estado concreto.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.message) from error


@router.get("", response_model=list[OrderRead])
def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderRead)
def get_my_order(
    order_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if order is None:
        # Mismo mensaje tanto si el pedido no existe como si es de otro
        # usuario: no confirmamos a nadie que un id de pedido concreto
        # existe si no le pertenece.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")
    return order