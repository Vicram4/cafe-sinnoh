from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field

from app.models.job_application import ApplicationStatus, JobPosition


class JobApplicationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=30)
    position: JobPosition
    experience: str = Field(min_length=1, max_length=2000)
    cover_letter: str | None = Field(default=None, max_length=2000)


class JobApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class JobApplicationRead(BaseModel):
    """Solo para el admin (FASE 12): incluye campos que el candidato no
    necesita ver de vuelta."""

    id: int
    full_name: str
    email: str
    phone: str
    position: JobPosition
    experience: str
    cover_letter: str | None
    status: ApplicationStatus
    created_at: datetime
    cv_original_name: str | None
    # Se lee del modelo para calcular has_cv, pero nunca se envía: la
    # clave interna del almacenamiento no debe salir de la API.
    cv_storage_key: str | None = Field(default=None, exclude=True)

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def has_cv(self) -> bool:
        return self.cv_storage_key is not None