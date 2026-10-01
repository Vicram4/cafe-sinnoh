from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.review import Review, ReviewStatus
from app.schemas.review import ReviewCreate
from app.services.orders import OrderValidationError


def has_purchased_product(db: Session, user_id: int, product_id: int) -> bool:
    """Solo cuenta como "comprado" un pedido ya COMPLETED: si alguien
    cancela el pedido o sigue pendiente, no puede reseñar todavía."""
    exists = (
        db.query(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            Order.user_id == user_id,
            Order.status == OrderStatus.COMPLETED,
            OrderItem.product_id == product_id,
        )
        .first()
    )
    return exists is not None


def create_review(db: Session, user_id: int, payload: ReviewCreate) -> Review:
    if not has_purchased_product(db, user_id, payload.product_id):
        raise OrderValidationError("Solo puedes reseñar productos que hayas comprado y recibido.")

    existing = (
        db.query(Review)
        .filter(Review.user_id == user_id, Review.product_id == payload.product_id)
        .first()
    )
    if existing is not None:
        raise OrderValidationError("Ya has escrito una reseña para este producto.")

    review = Review(
        user_id=user_id,
        product_id=payload.product_id,
        rating=payload.rating,
        comment=payload.comment,
        status=ReviewStatus.PENDING,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review