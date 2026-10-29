import math
from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.rate_limit import RateLimited, enforce_form_rate_limit

settings = get_settings()


def form_rate_limit(action: str) -> Callable[..., None]:
    """Dependencia anti-spam para los formularios públicos: limita los envíos
    por IP. Uso: dependencies=[Depends(form_rate_limit("contact"))]."""

    def dependency(request: Request, db: Session = Depends(get_db)) -> None:
        ip_address = request.client.host if request.client else "unknown"
        try:
            enforce_form_rate_limit(db, action, ip_address)
        except RateLimited as error:
            minutes = math.ceil(error.retry_after_seconds / 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Has enviado demasiadas solicitudes. Vuelve a intentarlo en {minutes} "
                f"{'minuto' if minutes == 1 else 'minutos'}.",
                headers={"Retry-After": str(error.retry_after_seconds)},
            ) from error

    return dependency


def reject_if_honeypot_filled(value: str | None) -> None:
    """Campo trampa: invisible para las personas, pero muchos bots rellenan
    todos los campos. Mensaje genérico, sin pistas de qué ha fallado."""
    if value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se ha podido procesar el envío.")

# tokenUrl le dice a Swagger UI (/docs) dónde está el endpoint de login,
# para poder mostrar el botón "Authorize" y probar rutas protegidas
# desde ahí directamente, sin herramientas externas.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    """Descifra el token, y va a buscar el usuario a la base de datos
    (no confía en datos guardados dentro del propio token, salvo el
    email). Cualquier ruta que dependa de esto exige un token válido."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la credencial.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    # Se comprueba en CADA petición, no solo en el login: un token ya
    # emitido sigue siendo criptográficamente válido hasta que caduca, así
    # que sin esto desactivar a un usuario no le cortaría el acceso hasta
    # entonces. Misma lógica que la del rol: la fuente de verdad es la BD.
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada.")
    return user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Dependencia adicional para rutas solo-admin: primero exige un
    usuario autenticado (get_current_user), y además comprueba el rol.
    Nunca se confía en un rol enviado desde el frontend: aquí es el
    backend quien lo verifica, siempre."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a este recurso.",
        )
    return current_user