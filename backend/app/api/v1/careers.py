from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.job_application import JobApplication
from app.models.user import User
from app.schemas.job_application import (
    JobApplicationCreate,
    JobApplicationRead,
    JobApplicationStatusUpdate,
)

router = APIRouter(prefix="/careers", tags=["careers"])


@router.post("/applications", response_model=JobApplicationRead, status_code=status.HTTP_201_CREATED)
def submit_application(payload: JobApplicationCreate, db: Session = Depends(get_db)) -> JobApplication:
    """Pública y sin autenticación: un candidato no necesita cuenta."""
    application = JobApplication(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications", response_model=list[JobApplicationRead])
def list_applications(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[JobApplication]:
    """Solo ADMIN: el briefing es explícito en que las candidaturas solo
    las puede consultar el administrador."""
    return db.query(JobApplication).order_by(JobApplication.created_at.desc()).all()


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