"""Límite de envíos por IP para los formularios públicos (anti-spam).

Igual que el límite de login, usa PostgreSQL y no la memoria del proceso,
para que funcione igual con uno o con varios procesos del backend."""

import math
from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.rate_limit_event import RateLimitEvent


class RateLimited(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"Bloqueado durante {retry_after_seconds} s.")
        self.retry_after_seconds = retry_after_seconds


def enforce_form_rate_limit(db: Session, action: str, ip_address: str) -> None:
    """Comprueba el límite y, si no se ha alcanzado, registra este envío."""
    settings = get_settings()
    window = timedelta(minutes=settings.form_window_minutes)
    now = db.scalar(select(func.now()))

    db.execute(delete(RateLimitEvent).where(RateLimitEvent.action == action, RateLimitEvent.created_at <= now - window))
    count, oldest = db.execute(
        select(func.count(), func.min(RateLimitEvent.created_at)).where(
            RateLimitEvent.action == action, RateLimitEvent.ip_address == ip_address
        )
    ).one()
    if count >= settings.form_max_submissions:
        db.commit()
        raise RateLimited(math.ceil((oldest + window - now).total_seconds()))

    db.add(RateLimitEvent(action=action, ip_address=ip_address))
    db.commit()
