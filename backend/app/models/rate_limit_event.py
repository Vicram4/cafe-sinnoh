from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class RateLimitEvent(Base):
    """Un envío de un formulario público (registro, contacto, empleo) desde
    una IP, para limitar el spam. Las filas fuera de la ventana se borran en
    cada envío (ver services/rate_limit.py)."""

    __tablename__ = "rate_limit_events"
    __table_args__ = (Index("ix_rate_limit_events_action_ip_created", "action", "ip_address", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
