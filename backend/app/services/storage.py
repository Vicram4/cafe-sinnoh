"""Almacenamiento de archivos subidos (de momento, solo CVs).

Toda la aplicación pasa por estas funciones y solo conoce la "clave" del
archivo. El contenido se guarda en la tabla stored_files (no en disco: los
alojamientos gratuitos lo pierden al reiniciar). Para pasar a S3 o similar
bastaría con cambiar este módulo."""

import uuid

from sqlalchemy.orm import Session

from app.models.stored_file import StoredFile


def save_cv(db: Session, content: bytes) -> str:
    """Añade el archivo a la sesión sin hacer commit: se guarda en la misma
    transacción que la candidatura, así que nunca queda un CV huérfano."""
    key = f"{uuid.uuid4().hex}.pdf"
    db.add(StoredFile(key=key, content=content))
    return key


def read_cv(db: Session, key: str) -> bytes | None:
    stored = db.get(StoredFile, key)
    return stored.content if stored is not None else None
