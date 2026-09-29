from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User, UserRole

settings = get_settings()

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