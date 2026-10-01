from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.v1.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderStatusUpdate
from app.services.orders import OrderValidationError, create_order, transition_order_status

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


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> Order:
    """Mecanismo mínimo para avanzar el estado de un pedido, necesario
    para que el programa de puntos pueda funcionar (FASE 9). El panel
    de administración completo (FASE 12) reutilizará este mismo
    endpoint; aquí solo se expone sin interfaz propia todavía."""
    # A diferencia de list_my_orders, no filtramos por user_id: un
    # admin gestiona pedidos de cualquier cliente.
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado.")

    try:
        return transition_order_status(db, order, payload.status)
    except OrderValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.message) from error

    

@router.get("/admin/all", response_model=list[OrderRead])
def list_all_orders(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[Order]:
    """Todos los pedidos de todos los usuarios, para el panel de admin.
    Distinto de list_my_orders (que filtra por el propio usuario)."""
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .all()
    )