import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class PointTransactionType(str, enum.Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    ADJUST = "ADJUST"


class PointTransaction(Base):
    """Ledger inmutable: nunca se actualiza ni se borra una fila, solo
    se añaden nuevas. El saldo de un usuario es siempre SUM(points)
    sobre sus filas, nunca una columna "balance" que pudiera
    desincronizarse. "points" es positivo para EARN, negativo para
    REDEEM."""

    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[PointTransactionType] = mapped_column(
        Enum(PointTransactionType, name="point_transaction_type"), nullable=False
    )
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    reward_id: Mapped[int | None] = mapped_column(ForeignKey("rewards.id"), nullable=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )