from pydantic import BaseModel, ConfigDict


class CategoryRead(BaseModel):
    id: int
    slug: str
    name: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)