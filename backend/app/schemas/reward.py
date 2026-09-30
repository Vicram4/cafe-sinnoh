from pydantic import BaseModel, ConfigDict


class RewardRead(BaseModel):
    id: int
    name: str
    description: str
    cost_points: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)