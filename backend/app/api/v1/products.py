from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.category import Category
from app.models.order import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.category import CategoryRead
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.products import ProductValidationError, ensure_single_inspiration

router = APIRouter(tags=["products"])


def _load_product(db: Session, product_id: int) -> Product | None:
    # Se recarga con joinedload tras escribir: ProductRead necesita la
    # categoría anidada, y así queda cargada antes de que la sesión se cierre.
    return (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )


def _ensure_category_exists(db: Session, category_id: int) -> None:
    if db.query(Category.id).filter(Category.id == category_id).first() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría indicada no existe."
        )


def _slug_conflict() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT, detail="Ya existe un producto con ese slug."
    )


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return db.query(Category).order_by(Category.sort_order).all()


@router.get("/products", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    # joinedload carga la categoría de cada producto en la misma
    # consulta SQL (un JOIN), en vez de una consulta extra por producto
    # al acceder a "product.category" (el problema clásico N+1).
    # No filtra por is_available: el panel de admin reutiliza este listado.
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


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    _ensure_category_exists(db, data.category_id)
    if db.query(Product.id).filter(Product.slug == data.slug).first() is not None:
        raise _slug_conflict()

    product = Product(**data.model_dump())
    try:
        ensure_single_inspiration(product)
    except ProductValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        # Carrera entre la comprobación del slug y el INSERT: la restricción
        # UNIQUE de la base de datos es la barrera definitiva.
        db.rollback()
        raise _slug_conflict()

    return _load_product(db, product.id)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> Product:
    product = _load_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

    changes = data.model_dump(exclude_unset=True)

    if "category_id" in changes:
        _ensure_category_exists(db, changes["category_id"])
    if "slug" in changes and changes["slug"] != product.slug:
        if db.query(Product.id).filter(Product.slug == changes["slug"]).first() is not None:
            raise _slug_conflict()

    for field, value in changes.items():
        setattr(product, field, value)

    try:
        ensure_single_inspiration(product)
    except ProductValidationError as exc:
        db.rollback()  # descarta los cambios aplicados en memoria
        raise HTTPException(status_code=422, detail=str(exc))

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _slug_conflict()

    return _load_product(db, product_id)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")

    # Un producto con pedidos históricos nunca se borra: se desactiva con
    # PATCH is_available=false, y así se conserva el historial íntegro.
    if db.query(OrderItem.id).filter(OrderItem.product_id == product_id).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tiene pedidos asociados; desactívalo en su lugar.",
        )

    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        # Otras tablas que referencian el producto (p. ej. reseñas).
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tiene datos asociados (reseñas u otros); desactívalo en su lugar.",
        )