import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class JobPosition(str, enum.Enum):
    BARISTA = "BARISTA"
    WAITER = "WAITER"
    KITCHEN = "KITCHEN"
    STORE_MANAGER = "STORE_MANAGER"
    MARKETING = "MARKETING"


class ApplicationStatus(str, enum.Enum):
    NEW = "NEW"
    REVIEWED = "REVIEWED"
    CONTACTED = "CONTACTED"
    REJECTED = "REJECTED"


class JobApplication(Base):
    """Sin relación con 'users': un candidato puede no tener cuenta en
    la aplicación. Es una tabla independiente a propósito."""

    __tablename__ = "job_applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    position: Mapped[JobPosition] = mapped_column(Enum(JobPosition, name="job_position"), nullable=False)
    experience: Mapped[str] = mapped_column(String(2000), nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    # El archivo vive en services/storage.py; aquí solo su clave generada
    # y el nombre original (que nunca se usa como nombre en disco).
    cv_storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cv_original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"), nullable=False, default=ApplicationStatus.NEW
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )