from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.order import Order, OrderItem, OrderStatus
from app.models.point_transaction import PointTransaction, PointTransactionType
from app.models.product import Product
from app.schemas.order import OrderCreate

# Máquina de estados: qué transiciones son válidas desde cada estado.
# COMPLETED y CANCELLED no aparecen como claves: son estados finales,
# sin salida posible.
ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY},
    OrderStatus.READY: {OrderStatus.COMPLETED},
}


class OrderValidationError(Exception):
    """Cualquier motivo por el que un pedido no puede crearse tal como
    se ha pedido. El router la traduce a un 400/404/409 según el caso."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def validate_pickup_time(pickup_at: datetime) -> None:
    settings = get_settings()
    now = datetime.now(timezone.utc)

    if pickup_at.tzinfo is None:
        raise OrderValidationError("La hora de recogida debe incluir la zona horaria.")

    earliest = now + timedelta(minutes=settings.min_pickup_lead_minutes)
    if pickup_at < earliest:
        raise OrderValidationError(
            f"La hora de recogida debe ser al menos {settings.min_pickup_lead_minutes} minutos después de ahora."
        )

    # Comparamos en hora local del servidor (simplificación válida
    # mientras el local tenga una única zona horaria real, España).
    local_hour = pickup_at.astimezone().hour
    if not (settings.shop_opening_hour <= local_hour < settings.shop_closing_hour):
        raise OrderValidationError(
            f"La hora de recogida debe estar entre las {settings.shop_opening_hour}:00 "
            f"y las {settings.shop_closing_hour}:00."
        )


def create_order(db: Session, user_id: int, payload: OrderCreate) -> Order:
    """Construye el pedido revalidando todo contra la base de datos:
    nunca se confía en nombres, precios ni disponibilidad enviados por
    el cliente. Es la aplicación directa de la regla que fijamos desde
    el análisis inicial del proyecto."""
    validate_pickup_time(payload.pickup_at)

    order_items: list[OrderItem] = []
    subtotal_cents = 0

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product is None:
            raise OrderValidationError(f"El producto con id {item.product_id} no existe.")
        if not product.is_available:
            raise OrderValidationError(f'El producto "{product.name}" no está disponible ahora mismo.')

        line_total = product.price_cents * item.quantity
        subtotal_cents += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price_cents=product.price_cents,
                quantity=item.quantity,
            )
        )

    # Sin descuentos todavía (recompensas llegan en la FASE 9): el
    # total coincide con el subtotal por ahora, pero mantenemos ambos
    # campos separados para no tener que migrar de nuevo entonces.
    order = Order(
        user_id=user_id,
        status="PENDING",
        pickup_at=payload.pickup_at,
        subtotal_cents=subtotal_cents,
        discount_cents=0,
        total_cents=subtotal_cents,
        notes=payload.notes,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def transition_order_status(db: Session, order: Order, new_status: OrderStatus) -> Order:
    """Aplica una transición de estado si es válida según la máquina de
    estados, y otorga puntos automáticamente al llegar a COMPLETED. El
    otorgamiento comprueba order.points_awarded para ser idempotente:
    una misma orden nunca otorga puntos dos veces, aunque se llamara
    por error dos veces a este mismo endpoint."""
    allowed = ALLOWED_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise OrderValidationError(
            f"No se puede pasar de {order.status.value} a {new_status.value}."
        )

    order.status = new_status

    if new_status == OrderStatus.COMPLETED and not order.points_awarded:
        # 1 punto por cada euro gastado (total_cents está en céntimos,
        # de ahí la división entre 100), redondeando hacia abajo.
        points_earned = order.total_cents // 100
        if points_earned > 0:
            db.add(
                PointTransaction(
                    user_id=order.user_id,
                    points=points_earned,
                    type=PointTransactionType.EARN,
                    order_id=order.id,
                    description=f"Pedido #{order.id} completado",
                )
            )
        order.points_awarded = True

    db.commit()
    db.refresh(order)
    return order