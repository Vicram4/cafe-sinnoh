from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    """Lo único que el cliente envía por línea: qué producto y cuántas
    unidades. Nunca un precio: eso lo decide siempre el servidor."""

    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    pickup_at: datetime
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price_cents: int
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    status: OrderStatus
    pickup_at: datetime
    subtotal_cents: int
    discount_cents: int
    total_cents: int
    notes: str | None
    created_at: datetime
    items: list[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)