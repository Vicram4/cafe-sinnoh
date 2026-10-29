from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.seed.seed_products import PRODUCTS, seed

REPO = Path(__file__).resolve().parents[2]


def test_every_seeded_product_has_its_illustration() -> None:
    """Las imágenes las sirve el frontend: si falta una, la carta mostraría un hueco."""
    missing = [p["slug"] for p in PRODUCTS if not (REPO / "frontend" / "public" / "products" / f"{p['slug']}.webp").is_file()]

    assert missing == []


def test_seed_sets_the_illustration_url(db: Session) -> None:
    seed()

    urls = dict(db.execute(select(Product.slug, Product.image_url)).all())
    assert urls["latte-piplup"] == "/products/latte-piplup.webp"
    assert all(url is not None for url in urls.values())


def test_seed_fills_missing_images_without_overwriting_admin_changes(db: Session) -> None:
    seed()
    without_image = db.scalar(select(Product).where(Product.slug == "latte-piplup"))
    customised = db.scalar(select(Product).where(Product.slug == "tosta-ruta-212"))
    without_image.image_url = None
    customised.image_url = "/products/otra-imagen.webp"
    db.commit()

    seed()

    db.expire_all()
    assert db.get(Product, without_image.id).image_url == "/products/latte-piplup.webp"
    assert db.get(Product, customised.id).image_url == "/products/otra-imagen.webp"
