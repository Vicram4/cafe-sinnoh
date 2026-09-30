from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.point_transaction import PointTransactionType


class PointTransactionRead(BaseModel):
    id: int
    points: int
    type: PointTransactionType
    order_id: int | None
    reward_id: int | None
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PointsSummary(BaseModel):
    balance: int
    transactions: list[PointTransactionRead]