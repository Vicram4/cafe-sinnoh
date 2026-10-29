from pathlib import PurePath

from fastapi import UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.job_application import JobApplication
from app.schemas.job_application import JobApplicationCreate
from app.services import storage


class CvValidationError(Exception):
    """Lleva su propio código HTTP (413, 415, 400) porque, a diferencia de
    OrderValidationError, cada fallo de un archivo tiene un código
    estándar distinto."""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


def _validate_cv(cv: UploadFile) -> tuple[bytes, str]:
    """Las tres comprobaciones son necesarias: extensión y content-type
    los declara el cliente y se pueden falsificar; la firma %PDF- es la
    única que mira el contenido real."""
    # Solo el nombre base: algunos navegadores antiguos envían la ruta completa.
    original_name = PurePath((cv.filename or "").replace("\\", "/")).name[:255]
    if not original_name.lower().endswith(".pdf") or cv.content_type != "application/pdf":
        raise CvValidationError("El CV debe ser un archivo PDF.", status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    max_bytes = get_settings().cv_max_bytes
    # Leer un byte de más basta para saber si se supera el límite sin
    # cargar en memoria un archivo arbitrariamente grande.
    content = cv.file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise CvValidationError("El CV no puede superar los 5 MB.", status.HTTP_413_CONTENT_TOO_LARGE)
    if not content:
        raise CvValidationError("El archivo del CV está vacío.", status.HTTP_400_BAD_REQUEST)
    if not content.startswith(b"%PDF-"):
        raise CvValidationError("El CV debe ser un archivo PDF.", status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    return content, original_name


def create_application(db: Session, payload: JobApplicationCreate, cv: UploadFile | None) -> JobApplication:
    application = JobApplication(**payload.model_dump())

    # Se valida antes de tocar disco o BD: si el CV no es válido, no se
    # crea la candidatura y el candidato puede corregirlo y reenviar.
    if cv is not None and cv.filename:
        content, original_name = _validate_cv(cv)
        application.cv_storage_key = storage.save_cv(content)
        application.cv_original_name = original_name

    db.add(application)
    try:
        db.commit()
    except Exception:
        db.rollback()
        # Sin esto quedaría en disco un archivo que ninguna fila referencia.
        if application.cv_storage_key:
            storage.delete_cv(application.cv_storage_key)
        raise
    db.refresh(application)
    return application
