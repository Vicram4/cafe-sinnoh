"""Tokens de renovación para mantener la sesión al recargar la página.

El access token (JWT, 30 min) sigue viviendo solo en memoria del
navegador. El token de renovación viaja en una cookie HttpOnly, que
JavaScript no puede leer (un XSS no puede robarlo), y sirve para pedir un
access token nuevo al recargar o cuando el anterior caduca."""

import hashlib
import secrets
from datetime import timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.refresh_token import RefreshToken
from app.models.user import User


class InvalidRefreshToken(Exception):
    pass


class InactiveUserRefresh(Exception):
    pass


def _hash(token: str) -> str:
    # SHA-256 simple (no Argon2): el token ya es aleatorio y largo, así que
    # no hace falta un hash lento contra diccionarios, como con contraseñas.
    return hashlib.sha256(token.encode()).hexdigest()


def _revoke_family(db: Session, family_id: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=func.now())
    )


def issue_refresh_token(db: Session, user_id: int, family_id: str | None = None) -> str:
    """Crea un token nuevo (sin hacer commit). Sin family_id, empieza una
    sesión nueva, es decir, un login."""
    token = secrets.token_urlsafe(48)
    days = get_settings().refresh_token_expire_days
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=_hash(token),
            family_id=family_id or secrets.token_hex(16),
            expires_at=func.now() + timedelta(days=days),
        )
    )
    return token


def start_session(db: Session, user_id: int) -> str:
    # Limpieza oportunista de tokens caducados, sin tareas programadas.
    db.execute(delete(RefreshToken).where(RefreshToken.expires_at < func.now()))
    token = issue_refresh_token(db, user_id)
    db.commit()
    return token


def rotate_refresh_token(db: Session, token: str) -> tuple[User, str]:
    """Rotación: el token usado se revoca y se emite otro de la misma
    familia. FOR UPDATE bloquea la fila para que dos renovaciones
    simultáneas con el mismo token no puedan tener éxito las dos."""
    record = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == _hash(token)).with_for_update()
    )
    if record is None:
        raise InvalidRefreshToken()

    if record.revoked_at is not None:
        # Un token ya usado vuelve a aparecer: alguien tiene una copia. Se
        # revoca la familia entera, también la sesión del usuario legítimo,
        # que tendrá que volver a iniciar sesión.
        _revoke_family(db, record.family_id)
        db.commit()
        raise InvalidRefreshToken()

    now = db.scalar(select(func.now()))
    if record.expires_at <= now:
        raise InvalidRefreshToken()

    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        _revoke_family(db, record.family_id)
        db.commit()
        raise InactiveUserRefresh()

    record.revoked_at = now
    new_token = issue_refresh_token(db, user.id, record.family_id)
    db.commit()
    return user, new_token


def end_session(db: Session, token: str) -> None:
    """Cierre de sesión real: revoca la sesión en el servidor, no solo en el
    navegador."""
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == _hash(token)))
    if record is not None:
        _revoke_family(db, record.family_id)
        db.commit()
