from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.models.user import User
from app.schemas.contact_message import ContactMessageCreate, ContactMessageRead

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactMessageRead, status_code=status.HTTP_201_CREATED)
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)) -> ContactMessage:
    message = ContactMessage(**payload.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("", response_model=list[ContactMessageRead])
def list_contact_messages(
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[ContactMessage]:
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()