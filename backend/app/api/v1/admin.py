from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.models.job_application import ApplicationStatus, JobApplication
from app.models.order import Order, OrderStatus
from app.models.review import Review, ReviewStatus
from app.models.user import User
from app.schemas.admin import AdminStats
from app.schemas.user import AdminUserUpdate, UserAdminRead

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> AdminStats:
    """Cifras básicas para el dashboard. Deliberadamente sencillo (sin
    gráficas de evolución ni filtros de fecha): el briefing pide
    demostrar capacidades Full-Stack, no construir un ERP."""
    total_users = db.query(func.count(User.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()

    total_revenue_cents = (
        db.query(func.coalesce(func.sum(Order.total_cents), 0))
        .filter(Order.status == OrderStatus.COMPLETED)
        .scalar()
    )

    status_rows = db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    orders_by_status = {status.value: count for status, count in status_rows}

    pending_reviews_count = (
        db.query(func.count(Review.id)).filter(Review.status == ReviewStatus.PENDING).scalar()
    )
    new_applications_count = (
        db.query(func.count(JobApplication.id))
        .filter(JobApplication.status == ApplicationStatus.NEW)
        .scalar()
    )
    unread_messages_count = (
        db.query(func.count(ContactMessage.id)).filter(ContactMessage.is_read.is_(False)).scalar()
    )

    return AdminStats(
        total_users=total_users,
        total_orders=total_orders,
        total_revenue_cents=int(total_revenue_cents),
        orders_by_status=orders_by_status,
        pending_reviews_count=pending_reviews_count,
        new_applications_count=new_applications_count,
        unread_messages_count=unread_messages_count,
    )


@router.get("/users", response_model=list[UserAdminRead])
def list_users(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[User]:
    return db.query(User).order_by(User.id).all()


@router.patch("/users/{user_id}", response_model=UserAdminRead)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> User:
    """Cambia rol y/o estado de un usuario. Un admin no puede tocar su
    propio rol ni desactivarse: así siempre queda al menos un admin
    activo (quien ejecuta la acción), sin contar administradores."""
    target = db.query(User).filter(User.id == user_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    if target.id == current_user.id:
        changes_own_role = payload.role is not None and payload.role != target.role
        deactivates_self = payload.is_active is False
        if changes_own_role or deactivates_self:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes cambiar tu propio rol ni desactivar tu propia cuenta.",
            )

    if payload.role is not None:
        target.role = payload.role
    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.commit()
    db.refresh(target)
    return target