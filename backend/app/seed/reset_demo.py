"""Reinicia la demo pública a su estado inicial. Ejecutar con:
python -m app.seed.reset_demo

BORRA TODOS LOS DATOS (cuentas, pedidos, mensajes, candidaturas y CVs) y
vuelve a sembrar productos, recompensas y la demo. Por eso solo funciona
con DEMO_MODE=true: así nunca puede vaciar una base de datos de verdad por
error. En la demo publicada se programa una vez al día."""

import sys

from sqlalchemy import text

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.seed import seed_demo, seed_products, seed_rewards


class DemoModeDisabled(Exception):
    pass


def reset() -> None:
    if not get_settings().demo_mode:
        raise DemoModeDisabled("Reinicio cancelado: solo se permite con DEMO_MODE=true (borra todos los datos).")

    # TRUNCATE de todas las tablas del modelo (alembic_version no está en
    # Base.metadata, así que el estado de las migraciones se conserva).
    tables = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))

    seed_products.seed()
    seed_rewards.seed()
    seed_demo.seed()


if __name__ == "__main__":
    try:
        reset()
    except DemoModeDisabled as error:
        print(error, file=sys.stderr)
        sys.exit(1)
    print("Demo reiniciada.")
