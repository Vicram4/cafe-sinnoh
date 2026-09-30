from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Controla el orden en que se muestran los filtros de categoría,
    # igual que el array categories.ts del frontend definía el orden
    # por su propia posición.
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)