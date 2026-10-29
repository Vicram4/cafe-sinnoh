from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import form_rate_limit, reject_if_honeypot_filled, require_admin
from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.models.user import User
from app.schemas.contact_message import (
    ContactMessageCreate,
    ContactMessageRead,
    ContactMessageReadUpdate,
)

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post(
    "",
    response_model=ContactMessageRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(form_rate_limit("contact"))],
)
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)) -> ContactMessage:
    reject_if_honeypot_filled(payload.website)
    message = ContactMessage(**payload.model_dump(exclude={"website"}))
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


@router.patch("/{message_id}", response_model=ContactMessageRead)
def set_message_read(
    message_id: int,
    payload: ContactMessageReadUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> ContactMessage:
    """Solo ADMIN: marcar un mensaje como leído o volver a dejarlo sin leer."""
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mensaje no encontrado.")

    message.is_read = payload.is_read
    db.commit()
    db.refresh(message)
    return message