from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

password_hash = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    """Crea un JWT firmado. 'subject' es el email del usuario, guardado
    en el claim estándar 'sub'. No incluimos el rol dentro del token: lo
    consultamos en cada petición desde la base de datos (ver deps.py),
    así que si un admin pierde el rol, el cambio surte efecto en la
    siguiente petición sin esperar a que el token expire."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)