from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.category import CategoryRead

# Solo minúsculas, números y guiones simples: el slug va en la URL pública
# (/menu/:slug), así que se restringe para evitar espacios o caracteres raros.
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class ProductRead(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    price_cents: int
    image_url: str | None
    ingredients: list[str]
    is_available: bool
    is_featured: bool
    inspiration_pokemon_name: str | None
    inspiration_pokedex_text: str | None
    inspiration_story: str | None
    location_name: str | None
    location_description: str | None
    category: CategoryRead

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    category_id: int
    slug: str = Field(min_length=1, max_length=120, pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=500)
    # Dinero siempre en céntimos (entero), igual que en el resto del proyecto.
    price_cents: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    ingredients: list[str] = Field(default_factory=list)
    is_available: bool = True
    is_featured: bool = False
    inspiration_pokemon_name: str | None = Field(default=None, max_length=100)
    inspiration_pokedex_text: str | None = Field(default=None, max_length=500)
    inspiration_story: str | None = Field(default=None, max_length=500)
    location_name: str | None = Field(default=None, max_length=100)
    location_description: str | None = Field(default=None, max_length=500)


# Campos que en la base de datos son NOT NULL: en un PATCH pueden omitirse,
# pero no enviarse explícitamente como null.
_NON_NULLABLE_ON_UPDATE = (
    "category_id",
    "slug",
    "name",
    "description",
    "price_cents",
    "ingredients",
    "is_available",
    "is_featured",
)


class ProductUpdate(BaseModel):
    """Todos los campos opcionales (PATCH parcial). Se distingue "no enviado"
    (se conserva) de "enviado como null" (se vacía) con model_fields_set /
    model_dump(exclude_unset=True), y eso permite, por ejemplo, borrar
    image_url o pasar de inspiración Pokémon a lugar."""

    category_id: int | None = None
    slug: str | None = Field(default=None, min_length=1, max_length=120, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1, max_length=500)
    price_cents: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    ingredients: list[str] | None = None
    is_available: bool | None = None
    is_featured: bool | None = None
    inspiration_pokemon_name: str | None = Field(default=None, max_length=100)
    inspiration_pokedex_text: str | None = Field(default=None, max_length=500)
    inspiration_story: str | None = Field(default=None, max_length=500)
    location_name: str | None = Field(default=None, max_length=100)
    location_description: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def reject_null_on_required_fields(self) -> "ProductUpdate":
        for field in _NON_NULLABLE_ON_UPDATE:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"El campo '{field}' no admite null.")
        return self