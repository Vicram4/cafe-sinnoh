from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryRead


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