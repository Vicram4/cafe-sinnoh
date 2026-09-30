from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.reward import Reward
from app.models.user import User
from app.schemas.points import PointTransactionRead
from app.schemas.reward import RewardRead
from app.services.orders import OrderValidationError
from app.services.points import redeem_reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=list[RewardRead])
def list_rewards(db: Session = Depends(get_db)) -> list[Reward]:
    return db.query(Reward).filter(Reward.is_active.is_(True)).order_by(Reward.cost_points).all()


@router.post("/{reward_id}/redeem", response_model=PointTransactionRead, status_code=status.HTTP_201_CREATED)
def redeem(
    reward_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    try:
        return redeem_reward(db, user_id=current_user.id, reward_id=reward_id)
    except OrderValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.message) from error