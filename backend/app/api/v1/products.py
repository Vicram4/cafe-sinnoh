from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryRead
from app.schemas.product import ProductRead

router = APIRouter(tags=["products"])


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return db.query(Category).order_by(Category.sort_order).all()


@router.get("/products", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    # joinedload carga la categoría de cada producto en la misma
    # consulta SQL (un JOIN), en vez de una consulta extra por producto
    # al acceder a "product.category" (el problema clásico N+1).
    return db.query(Product).options(joinedload(Product.category)).order_by(Product.id).all()


@router.get("/products/{slug}", response_model=ProductRead)
def get_product(slug: str, db: Session = Depends(get_db)) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.slug == slug)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    return product