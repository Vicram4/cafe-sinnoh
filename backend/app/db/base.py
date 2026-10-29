# Importa aquí cada modelo nuevo que crees. Este archivo no se usa
# directamente en el código de la aplicación: su único propósito es que
# Alembic (a través de env.py) "vea" todos los modelos en un solo sitio
# al generar migraciones. Sin este import, Base.metadata no sabría que
# la tabla "users" existe, aunque el modelo esté definido en otro lugar.
from app.db.base_class import Base  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.contact_message import ContactMessage  # noqa: F401
from app.models.job_application import JobApplication  # noqa: F401
from app.models.login_attempt import LoginAttempt  # noqa: F401
from app.models.order import Order, OrderItem  # noqa: F401
from app.models.point_transaction import PointTransaction  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.reward import Reward  # noqa: F401
from app.models.user import User  # noqa: F401