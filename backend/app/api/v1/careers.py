from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.job_application import JobApplication
from app.models.user import User
from app.schemas.job_application import JobApplicationCreate, JobApplicationRead

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