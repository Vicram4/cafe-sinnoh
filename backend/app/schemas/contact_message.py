from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    message: str = Field(min_length=1, max_length=2000)
    # Campo trampa anti-bots: invisible en el formulario, debe llegar vacío.
    website: str | None = None


class ContactMessageReadUpdate(BaseModel):
    is_read: bool


class ContactMessageRead(BaseModel):
    id: int
    name: str
    email: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)