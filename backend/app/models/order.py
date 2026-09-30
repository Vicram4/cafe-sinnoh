import enum
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal_cents >= 0", name="ck_orders_subtotal_non_negative"),
        CheckConstraint("total_cents >= 0", name="ck_orders_total_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.PENDING, index=True
    )
    pickup_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    subtotal_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    # Sin descuentos todavía (llegan con el programa de recompensas en
    # la FASE 9); dejamos el campo ya listo con 0 por defecto, en vez de
    # tener que añadir una columna nueva y migrar de nuevo entonces.
    discount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Idempotencia para el sistema de puntos de la FASE 9: evita que un
    # fallo o una doble llamada otorgue puntos dos veces por el mismo
    # pedido.
    points_awarded: Mapped[bool] = mapped_column(nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    # RESTRICT (el valor por defecto de una FK sin especificar) impide
    # borrar un producto que aparece en algún pedido histórico: hay que
    # marcarlo como no disponible, nunca eliminarlo de verdad.
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)

    # Snapshots: una vez creado el pedido, estos valores ya no cambian
    # aunque el producto se renombre o cambie de precio después. Es la
    # única forma de que un histórico de pedidos sea fiable.
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")