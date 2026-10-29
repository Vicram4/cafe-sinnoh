from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.v1.deps import form_rate_limit, reject_if_honeypot_filled, require_admin
from app.db.session import get_db
from app.models.job_application import JobApplication
from app.models.user import User
from app.schemas.job_application import (
    JobApplicationCreate,
    JobApplicationRead,
    JobApplicationStatusUpdate,
)
from app.services import storage
from app.services.careers import CvValidationError, create_application

router = APIRouter(prefix="/careers", tags=["careers"])


def _application_form(
    full_name: Annotated[str, Form()],
    email: Annotated[str, Form()],
    phone: Annotated[str, Form()],
    position: Annotated[str, Form()],
    experience: Annotated[str, Form()],
    cover_letter: Annotated[str | None, Form()] = None,
    # Campo trampa anti-bots: invisible en el formulario, debe llegar vacío.
    website: Annotated[str | None, Form()] = None,
) -> JobApplicationCreate:
    """FastAPI 0.141 no reparte un modelo Form() en campos cuando el
    endpoint también recibe un archivo, así que se leen uno a uno y se
    valida con el mismo esquema de antes (las reglas siguen en un solo
    sitio). Los errores se devuelven como el 422 estándar."""
    reject_if_honeypot_filled(website)
    try:
        return JobApplicationCreate(
            full_name=full_name,
            email=email,
            phone=phone,
            position=position,
            experience=experience,
            # Un textarea vacío llega como "" en un formulario.
            cover_letter=cover_letter or None,
        )
    except ValidationError as error:
        raise RequestValidationError(
            [{**e, "loc": ("body", *e["loc"])} for e in error.errors(include_url=False)]
        ) from error


@router.post(
    "/applications",
    response_model=JobApplicationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(form_rate_limit("careers"))],
)
def submit_application(
    payload: Annotated[JobApplicationCreate, Depends(_application_form)],
    cv: Annotated[UploadFile | None, File()] = None,
    db: Session = Depends(get_db),
) -> JobApplication:
    """Pública y sin autenticación: un candidato no necesita cuenta.
    multipart/form-data para poder adjuntar el CV (opcional)."""
    try:
        return create_application(db, payload, cv)
    except CvValidationError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/applications", response_model=list[JobApplicationRead])
def list_applications(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[JobApplication]:
    """Solo ADMIN: el briefing es explícito en que las candidaturas solo
    las puede consultar el administrador."""
    return db.query(JobApplication).order_by(JobApplication.created_at.desc()).all()


@router.get("/applications/{application_id}/cv")
def download_application_cv(
    application_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> Response:
    """Solo ADMIN. Devuelve los bytes (no una URL pública) para que el
    acceso al CV pase siempre por la comprobación de rol."""
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidatura no encontrada.")
    if application.cv_storage_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esta candidatura no tiene CV.")

    content = storage.read_cv(db, application.cv_storage_key)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encuentra el archivo del CV.")

    # El nombre original lo eligió el candidato: se codifica según RFC 5987
    # para admitir tildes y evitar que rompa la cabecera.
    filename = quote(application.cv_original_name or "cv.pdf")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"cv.pdf\"; filename*=UTF-8''{filename}",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.patch("/applications/{application_id}/status", response_model=JobApplicationRead)
def update_application_status(
    application_id: int,
    payload: JobApplicationStatusUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> JobApplication:
    """Solo ADMIN. Sin máquina de estados a propósito: es un seguimiento
    manual del proceso de selección y el admin debe poder corregir un
    error (p. ej. volver de REJECTED a REVIEWED)."""
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidatura no encontrada.")

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application