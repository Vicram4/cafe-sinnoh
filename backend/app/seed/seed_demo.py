"""Cuentas y datos de la demo pública. Ejecutar con:
python -m app.seed.seed_demo

Requiere haber sembrado antes productos y recompensas. Es idempotente: si
las cuentas de demo ya existen, no hace nada.

Las credenciales se muestran a propósito en la pantalla de login (deben
coincidir con frontend/src/data/demo.ts). Usan example.com, un dominio
reservado para ejemplos (RFC 2606): nunca pertenecerá a nadie."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

# Registra TODOS los modelos: sin esto, al ejecutarlo como comando SQLAlchemy
# no conoce la tabla rewards y falla al resolver las claves foráneas.
import app.db.base  # noqa: F401
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.contact_message import ContactMessage
from app.models.job_application import JobApplication, JobPosition
from app.models.order import Order, OrderItem, OrderStatus
from app.models.point_transaction import PointTransaction, PointTransactionType
from app.models.product import Product
from app.models.review import Review, ReviewStatus
from app.models.user import User, UserRole

DEMO_CUSTOMER = {"email": "demo.cliente@example.com", "password": "cafe-demo-cliente", "full_name": "Cliente Demo"}
DEMO_ADMIN = {"email": "demo.admin@example.com", "password": "cafe-demo-admin", "full_name": "Admin Demo"}


def _user(db: Session, data: dict, role: UserRole) -> User:
    user = User(
        email=data["email"],
        password_hash=hash_password(data["password"]),
        full_name=data["full_name"],
        role=role,
    )
    db.add(user)
    db.flush()
    return user


def _order(db: Session, user: User, lines: list[tuple[Product, int]], status: OrderStatus, days_ago: int) -> Order:
    """Pedido con la copia de nombre y precio de cada línea, como los reales."""
    total = sum(product.price_cents * quantity for product, quantity in lines)
    pickup = (datetime.now(timezone.utc) - timedelta(days=days_ago)).replace(hour=10, minute=30, second=0, microsecond=0)
    order = Order(
        user_id=user.id,
        status=status,
        pickup_at=pickup,
        subtotal_cents=total,
        discount_cents=0,
        total_cents=total,
        points_awarded=status == OrderStatus.COMPLETED,
        items=[
            OrderItem(product_id=p.id, product_name=p.name, unit_price_cents=p.price_cents, quantity=q)
            for p, q in lines
        ],
    )
    db.add(order)
    db.flush()
    if status == OrderStatus.COMPLETED:
        db.add(
            PointTransaction(
                user_id=user.id,
                points=total // 100,
                type=PointTransactionType.EARN,
                order_id=order.id,
                description=f"Pedido #{order.id} completado",
            )
        )
    return order


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == DEMO_ADMIN["email"]).first() is not None:
            print("Demo: las cuentas ya existen.")
            return

        products = db.query(Product).order_by(Product.id).all()
        if len(products) < 3:
            raise RuntimeError("Siembra antes los productos: python -m app.seed.seed_products")

        customer = _user(db, DEMO_CUSTOMER, UserRole.USER)
        _user(db, DEMO_ADMIN, UserRole.ADMIN)

        # Historial del cliente: pedidos completados (con puntos), uno en
        # curso para que el admin pueda avanzarlo, y reseñas en los dos
        # estados para que la moderación tenga algo que enseñar.
        _order(db, customer, [(products[0], 2), (products[1], 1)], OrderStatus.COMPLETED, days_ago=9)
        _order(db, customer, [(products[2], 3)], OrderStatus.COMPLETED, days_ago=4)
        _order(db, customer, [(products[1], 1)], OrderStatus.CONFIRMED, days_ago=0)
        db.add(Review(user_id=customer.id, product_id=products[0].id, rating=5, comment="El sitio perfecto para empezar la ruta.", status=ReviewStatus.APPROVED))
        db.add(Review(user_id=customer.id, product_id=products[2].id, rating=4, comment="Muy rico, aunque volvería a pedirlo menos dulce.", status=ReviewStatus.PENDING))

        # Bandeja de entrada del admin.
        db.add(ContactMessage(name="Lucía (demo)", email="lucia@example.com", message="¿Tenéis opciones sin lactosa?"))
        db.add(
            JobApplication(
                full_name="Mario (demo)",
                email="mario@example.com",
                phone="600000000",
                position=JobPosition.BARISTA,
                experience="Dos años como barista en una cafetería de especialidad.",
            )
        )
        db.commit()
        print("Demo: cuentas y datos de ejemplo creados.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
