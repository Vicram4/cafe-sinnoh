from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.review import Review, ReviewStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewModerate, ReviewRead
from app.services.orders import OrderValidationError
from app.services.reviews import create_review

router = APIRouter(tags=["reviews"])


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)) -> list[ReviewRead]:
    """Pública: solo reseñas ya aprobadas. Sin esto, cualquier texto
    enviado por un cliente se vería en la web antes de moderarlo."""
    rows = (
        db.query(Review, User.full_name)
        .join(User, User.id == Review.user_id)
        .filter(Review.product_id == product_id, Review.status == ReviewStatus.APPROVED)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        ReviewRead(
            id=review.id,
            product_id=review.product_id,
            rating=review.rating,
            comment=review.comment,
            status=review.status,
            created_at=review.created_at,
            author_name=full_name,
        )
        for review, full_name in rows
    ]


@router.post("/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review_endpoint(
    payload: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ReviewRead:
    try:
        review = create_review(db, user_id=current_user.id, payload=payload)
    except OrderValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.message) from error

    return ReviewRead(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        status=review.status,
        created_at=review.created_at,
        author_name=current_user.full_name,
    )


@router.get("/reviews/me", response_model=list[ReviewRead])
def list_my_reviews(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[ReviewRead]:
    """A diferencia del listado público, aquí el propio autor ve todas
    sus reseñas, aprobadas o no: necesita poder comprobar si siguen
    pendientes de moderación."""
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [
        ReviewRead(
            id=r.id,
            product_id=r.product_id,
            rating=r.rating,
            comment=r.comment,
            status=r.status,
            created_at=r.created_at,
            author_name=current_user.full_name,
        )
        for r in reviews
    ]


@router.patch("/reviews/{review_id}/moderate", response_model=ReviewRead)
def moderate_review(
    review_id: int,
    payload: ReviewModerate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> ReviewRead:
    """Mecanismo mínimo de moderación, sin interfaz todavía (igual que
    el cambio de estado de pedidos en la FASE 9): el panel de admin de
    la FASE 12 reutilizará este mismo endpoint."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reseña no encontrada.")

    review.status = payload.status
    db.commit()
    db.refresh(review)

    author = db.query(User).filter(User.id == review.user_id).first()
    return ReviewRead(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        status=review.status,
        created_at=review.created_at,
        author_name=author.full_name if author else "Usuario eliminado",
    )