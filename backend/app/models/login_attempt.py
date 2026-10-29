from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class LoginAttempt(Base):
    """Un intento de login FALLIDO, para limitar la fuerza bruta. Las filas
    caducan al salir de la ventana de tiempo y se borran solas (ver
    services/login_attempts.py), así que la tabla nunca crece ni conserva
    datos personales más tiempo del necesario.

    Se guarda una huella HMAC del email, nunca el email en claro: a veces se
    escribe por error la contraseña en el campo del email."""

    __tablename__ = "login_attempts"
    # Cubren las dos consultas del límite: por cuenta+IP y solo por IP.
    __table_args__ = (
        Index("ix_login_attempts_identifier_ip_created", "identifier_hash", "ip_address", "created_at"),
        Index("ix_login_attempts_ip_created", "ip_address", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    identifier_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    # 45 caracteres: longitud máxima de una dirección IPv6 en texto.
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
