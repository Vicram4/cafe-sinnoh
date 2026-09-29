from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base de la que heredarán todos los modelos (User, Product,
    Order...). SQLAlchemy usa esto para saber qué tablas existen: cada
    modelo que herede de Base queda registrado automáticamente, y
    Alembic lee ese registro para generar migraciones."""

    pass