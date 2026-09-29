from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.deps import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def admin_ping(current_user: Annotated[User, Depends(require_admin)]) -> dict:
    """Ruta de prueba temporal: confirma que solo un usuario con rol
    ADMIN puede acceder. Se sustituirá por las rutas reales del panel
    de administración en la FASE 12."""
    return {"message": f"Hola, {current_user.full_name}. Acceso admin confirmado."}