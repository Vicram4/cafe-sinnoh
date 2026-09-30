"""Siembra recompensas iniciales. Ejecutar con:
python -m app.seed.seed_rewards
"""

from app.db.session import SessionLocal
from app.models.reward import Reward

REWARDS = [
    {"name": "Café gratis", "description": "Un café a elegir de la categoría Cafés.", "cost_points": 100},
    {"name": "Dulce gratis", "description": "Una galleta o trufa a elegir.", "cost_points": 60},
    {"name": "10% en tu próximo pedido", "description": "Descuento aplicado al enseñar el código en el mostrador.", "cost_points": 150},
]


def seed() -> None:
    db = SessionLocal()
    try:
        for data in REWARDS:
            existing = db.query(Reward).filter(Reward.name == data["name"]).first()
            if existing is None:
                db.add(Reward(**data))
        db.commit()
        print(f"Recompensas: {len(REWARDS)}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()