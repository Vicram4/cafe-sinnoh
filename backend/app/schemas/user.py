from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator

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


class UserAdminRead(UserRead):
    # Solo para el panel de administración: la fecha de alta no hace
    # falta en las respuestas normales de usuario.
    created_at: datetime


class AdminUserUpdate(BaseModel):
    """PATCH parcial: solo rol y estado. Nada más es editable por el
    admin (ni email ni contraseña)."""

    role: UserRole | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_some_change(self) -> "AdminUserUpdate":
        if self.role is None and self.is_active is None:
            raise ValueError("Indica al menos 'role' o 'is_active'.")
        return self