from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.point_transaction import PointTransaction
from app.models.user import User
from app.schemas.points import PointsSummary
from app.services.points import get_points_balance

router = APIRouter(prefix="/points", tags=["points"])


@router.get("/me", response_model=PointsSummary)
def get_my_points(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> PointsSummary:
    transactions = (
        db.query(PointTransaction)
        .filter(PointTransaction.user_id == current_user.id)
        .order_by(PointTransaction.created_at.desc())
        .all()
    )
    return PointsSummary(balance=get_points_balance(db, current_user.id), transactions=transactions)