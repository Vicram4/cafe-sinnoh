from app.models.product import Product


class ProductValidationError(Exception):
    """Regla de negocio incumplida al crear o editar un producto."""


def _has_text(value: str | None) -> bool:
    return value is not None and value.strip() != ""


def ensure_single_inspiration(product: Product) -> None:
    """Un producto tiene inspiración Pokémon O lugar, nunca ambas.

    Se valida sobre el producto ya combinado (no sobre el payload) a
    propósito: en un PATCH parcial, el cuerpo puede traer solo
    "location_name" mientras el producto ya guardado tiene campos
    Pokémon. Solo mirando el resultado final se detecta el conflicto.
    La base de datos no impone esta regla, así que esta es la única
    barrera: cualquier escritura de productos debe pasar por aquí.
    """
    has_pokemon = any(
        _has_text(v)
        for v in (
            product.inspiration_pokemon_name,
            product.inspiration_pokedex_text,
            product.inspiration_story,
        )
    )
    has_location = any(
        _has_text(v) for v in (product.location_name, product.location_description)
    )
    if has_pokemon and has_location:
        raise ProductValidationError(
            "Un producto no puede tener inspiración Pokémon y lugar a la vez. "
            "Vacía uno de los dos grupos de campos."
        )