from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.point_transaction import PointTransaction, PointTransactionType
from app.models.reward import Reward
from app.services.orders import OrderValidationError


def get_points_balance(db: Session, user_id: int) -> int:
    total = (
        db.query(func.coalesce(func.sum(PointTransaction.points), 0))
        .filter(PointTransaction.user_id == user_id)
        .scalar()
    )
    return int(total)


def redeem_reward(db: Session, user_id: int, reward_id: int) -> PointTransaction:
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.is_active.is_(True)).first()
    if reward is None:
        raise OrderValidationError("La recompensa no existe o no está disponible.")

    balance = get_points_balance(db, user_id)
    if balance < reward.cost_points:
        raise OrderValidationError(
            f"No tienes puntos suficientes. Te faltan {reward.cost_points - balance} puntos."
        )

    transaction = PointTransaction(
        user_id=user_id,
        points=-reward.cost_points,
        type=PointTransactionType.REDEEM,
        reward_id=reward.id,
        description=f'Canje: "{reward.name}"',
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction