import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.v1.deps import form_rate_limit, get_current_user, reject_if_honeypot_filled
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead
from app.core.config import get_settings
from app.services.passwords import WeakPasswordError, check_password_strength
from app.services.refresh_tokens import (
    InactiveUserRefresh,
    InvalidRefreshToken,
    end_session,
    rotate_refresh_token,
    start_session,
)
from app.services.login_attempts import (
    LoginRateLimited,
    clear_failed_logins,
    ensure_login_allowed,
    record_failed_login,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# La cookie solo se envía a /api/v1/auth (refresh y logout), no al resto de
# la API. SameSite=Strict: el navegador no la envía en peticiones que
# vengan de otra web, lo que evita ataques CSRF contra refresh y logout.
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(form_rate_limit("register"))],
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    reject_if_honeypot_filled(payload.website)
    try:
        check_password_strength(payload.password, payload.email)
    except WeakPasswordError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

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
    response: Response,
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
    _set_refresh_cookie(response, start_session(db, user.id))
    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token)


@router.post("/refresh", response_model=Token)
def refresh(request: Request, db: Session = Depends(get_db)) -> Response:
    """Da un access token nuevo a partir de la cookie de renovación (al
    recargar la página o cuando el anterior caduca). No usa el header
    Authorization: el navegador envía la cookie solo."""
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if token is None:
        return _reject(status.HTTP_401_UNAUTHORIZED, "No hay ninguna sesión que renovar.")
    try:
        user, new_token = rotate_refresh_token(db, token)
    except InvalidRefreshToken:
        return _reject(status.HTTP_401_UNAUTHORIZED, "La sesión ha caducado. Vuelve a iniciar sesión.")
    except InactiveUserRefresh:
        return _reject(status.HTTP_403_FORBIDDEN, "Cuenta desactivada.")

    response = JSONResponse(Token(access_token=create_access_token(subject=user.email)).model_dump())
    _set_refresh_cookie(response, new_token)
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, db: Session = Depends(get_db)) -> Response:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if token is not None:
        end_session(db, token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _delete_refresh_cookie(response)
    return response



def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite="strict",
    )


def _delete_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=get_settings().refresh_cookie_secure,
        samesite="strict",
    )


def _reject(status_code: int, detail: str) -> Response:
    """Error que además borra la cookie inválida. Con HTTPException no se
    podría: FastAPI descarta los cambios hechos en la respuesta."""
    response = JSONResponse({"detail": detail}, status_code=status_code)
    _delete_refresh_cookie(response)
    return response


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Ruta de prueba: confirma que un token válido identifica
    correctamente al usuario. Útil también más adelante para la
    pantalla de perfil del frontend (FASE 9)."""
    return current_user