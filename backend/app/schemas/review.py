from datetime import datetime

from pydantic import BaseModel, Field

from app.models.review import ReviewStatus


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)


class ReviewModerate(BaseModel):
    status: ReviewStatus


class ReviewRead(BaseModel):
    id: int
    product_id: int
    rating: int
    comment: str
    status: ReviewStatus
    created_at: datetime
    # No viene directamente del modelo Review (que no guarda el
    # nombre): se construye a mano en el router, cruzando con User.
    author_name: str


class ReviewAdminRead(ReviewRead):
    # Solo para el panel de administración: el moderador necesita saber
    # sobre qué producto trata cada reseña. Se mantiene separado de
    # ReviewRead para no engordar las respuestas públicas.
    product_name: str
    product_slug: str