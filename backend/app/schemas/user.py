from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Lo que el cliente envía al registrarse. EmailStr valida el
    formato del email automáticamente (requiere el paquete
    email-validator, instalado como dependencia de FastAPI)."""

    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None


class UserRead(BaseModel):
    """Lo que la API devuelve. No incluye password_hash: es
    estructuralmente imposible exponerlo por accidente, porque el
    campo ni siquiera existe en este esquema."""

    id: int
    email: EmailStr
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool

    # from_attributes permite construir este esquema directamente desde
    # un objeto SQLAlchemy (user.email, user.full_name...) en vez de
    # exigir un diccionario.
    model_config = ConfigDict(from_attributes=True)