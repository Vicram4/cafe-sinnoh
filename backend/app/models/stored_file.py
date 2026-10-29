from datetime import datetime

from sqlalchemy import DateTime, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class StoredFile(Base):
    """Contenido de los archivos subidos (de momento, solo CVs).

    Van en la BD y no en disco porque los alojamientos gratuitos no
    conservan los archivos al reiniciar el servidor. Tabla aparte para que
    listar candidaturas nunca cargue los PDFs. Solo se accede a ella a
    través de services/storage.py."""

    __tablename__ = "stored_files"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
