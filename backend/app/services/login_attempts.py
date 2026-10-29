"""Límite de intentos de login fallidos (protección contra fuerza bruta).

Dos límites dentro de una ventana deslizante:
- por cuenta + IP: frena adivinar la contraseña de una cuenta concreta. No
  se limita solo por cuenta porque entonces cualquiera podría bloquear la
  cuenta de otra persona fallando a propósito desde su propia IP.
- solo por IP: frena probar muchas cuentas distintas desde el mismo origen.

Detrás de un proxy (Docker, producción), la IP que llega es la del proxy:
habrá que arrancar uvicorn con --proxy-headers para recibir la real."""

import hashlib
import hmac
import math
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.login_attempt import LoginAttempt


class LoginRateLimited(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"Bloqueado durante {retry_after_seconds} s.")
        self.retry_after_seconds = retry_after_seconds


def _identifier_hash(email: str) -> str:
    """HMAC y no un hash simple: sin la SECRET_KEY no se puede comprobar si
    un email concreto aparece en la tabla probando emails conocidos."""
    secret = get_settings().secret_key.encode()
    return hmac.new(secret, email.strip().lower().encode(), hashlib.sha256).hexdigest()


def _window_start(db: Session) -> tuple[datetime, datetime]:
    # La hora la da PostgreSQL, la misma que pone created_at, para no
    # depender de que el reloj del servidor y el de la BD coincidan.
    now = db.scalar(select(func.now()))
    return now, now - timedelta(minutes=get_settings().login_failure_window_minutes)


def ensure_login_allowed(db: Session, email: str, ip_address: str) -> None:
    """Se llama ANTES de comprobar la contraseña: durante un bloqueo, ni
    siquiera la contraseña correcta permite entrar. Si no, un atacante
    seguiría pudiendo adivinarla por la diferencia de respuesta."""
    settings = get_settings()
    now, window_start = _window_start(db)
    recent = select(func.count(), func.min(LoginAttempt.created_at)).where(
        LoginAttempt.ip_address == ip_address, LoginAttempt.created_at > window_start
    )
    limits = [
        (recent.where(LoginAttempt.identifier_hash == _identifier_hash(email)), settings.login_max_failures_per_account),
        (recent, settings.login_max_failures_per_ip),
    ]

    retry_after = 0
    for query, max_failures in limits:
        count, oldest = db.execute(query).one()
        if count >= max_failures:
            # Ventana deslizante: se vuelve a permitir cuando el fallo más
            # antiguo de la ventana caduca.
            unlocks_at = oldest + timedelta(minutes=settings.login_failure_window_minutes)
            retry_after = max(retry_after, math.ceil((unlocks_at - now).total_seconds()))
    if retry_after > 0:
        raise LoginRateLimited(retry_after)


def record_failed_login(db: Session, email: str, ip_address: str) -> None:
    _, window_start = _window_start(db)
    # Limpieza oportunista: los fallos que ya no cuentan se borran aquí, sin
    # tareas programadas, y la tabla solo conserva la última ventana.
    db.execute(delete(LoginAttempt).where(LoginAttempt.created_at <= window_start))
    db.add(LoginAttempt(identifier_hash=_identifier_hash(email), ip_address=ip_address))
    db.commit()


def clear_failed_logins(db: Session, email: str, ip_address: str) -> None:
    db.execute(
        delete(LoginAttempt).where(
            LoginAttempt.identifier_hash == _identifier_hash(email), LoginAttempt.ip_address == ip_address
        )
    )
    db.commit()
