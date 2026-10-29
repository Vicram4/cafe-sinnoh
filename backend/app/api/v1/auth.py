import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead
from app.services.login_attempts import (
    LoginRateLimited,
    clear_failed_logins,
    ensure_login_allowed,
    record_failed_login,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con este email.",
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    # OAuth2PasswordRequestForm exige campos "username" y "password" (es
    # el estándar del protocolo). Usamos el email del usuario como valor
    # de "username": en /docs, ese campo se llama "username" mismo,
    # pero ahí escribes tu email.
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    ip_address = request.client.host if request.client else "unknown"
    try:
        ensure_login_allowed(db, form_data.username, ip_address)
    except LoginRateLimited as error:
        minutes = math.ceil(error.retry_after_seconds / 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos fallidos. Vuelve a intentarlo en {minutes} "
            f"{'minuto' if minutes == 1 else 'minutos'}.",
            headers={"Retry-After": str(error.retry_after_seconds)},
        ) from error

    user = db.query(User).filter(User.email == form_data.username).first()

    # Un único mensaje genérico para email no encontrado y contraseña
    # incorrecta: así no revelamos a un atacante si un email concreto
    # está registrado o no.
    if user is None or not verify_password(form_data.password, user.password_hash):
        record_failed_login(db, form_data.username, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada.")

    clear_failed_logins(db, form_data.username, ip_address)
    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Ruta de prueba: confirma que un token válido identifica
    correctamente al usuario. Útil también más adelante para la
    pantalla de perfil del frontend (FASE 9)."""
    return current_user