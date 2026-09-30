from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.category import Category


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (CheckConstraint("price_cents >= 0", name="ck_products_price_non_negative"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ingredients: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Campos de inspiración "aplanados" directamente en la tabla, en vez
    # de una tabla aparte: para el volumen de datos de este proyecto
    # (12-20 productos), una tabla de inspiraciones separada añadiría
    # una unión (JOIN) más sin ningún beneficio real. Todos son
    # opcionales porque no todo producto tiene inspiración de uno u
    # otro tipo (nunca de los dos a la vez, aunque la base de datos no
    # lo impone; lo controla el propio contenido que sembramos).
    inspiration_pokemon_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    inspiration_pokedex_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    inspiration_story: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    category: Mapped[Category] = relationship()