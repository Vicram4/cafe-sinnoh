import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class UserRole(str, enum.Enum):
    """Los dos roles del briefing. Heredar de str además de Enum permite
    comparar el valor directamente con texto ("USER") sin conversiones,
    y que se serialice de forma legible en JSON."""

    USER = "USER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    # unique=True crea un índice único a nivel de base de datos: incluso
    # si el backend tuviera un fallo de validación, PostgreSQL rechazaría
    # dos usuarios con el mismo email. Nunca confiar solo en el frontend.
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.USER
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # server_default=func.now() hace que sea PostgreSQL quien ponga la
    # fecha (no Python), evitando desajustes si el servidor y la base de
    # datos estuvieran en zonas horarias o relojes distintos.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )