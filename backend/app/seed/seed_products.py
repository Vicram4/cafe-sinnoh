"""Siembra el catálogo inicial de Café Sinnoh en la base de datos.

Ejecutar con:  python -m app.seed.seed_products

Es idempotente: si una categoría o producto con ese slug ya existe, no
se duplica, así se puede ejecutar varias veces sin miedo.
"""

from app.db.session import SessionLocal
from app.models.category import Category
from app.models.product import Product

CATEGORIES = [
    {"slug": "cafes", "name": "Cafés", "sort_order": 0},
    {"slug": "bebidas", "name": "Bebidas", "sort_order": 1},
    {"slug": "bocadillos", "name": "Bocadillos", "sort_order": 2},
    {"slug": "pasteles", "name": "Pasteles", "sort_order": 3},
    {"slug": "dulces", "name": "Dulces", "sort_order": 4},
    {"slug": "packs", "name": "Packs", "sort_order": 5},
]

PRODUCTS = [
    {
        "slug": "espresso-monte-corona",
        "name": "Espresso Monte Corona",
        "description": "Espresso intenso de tueste oscuro, con un punto ahumado que recuerda a las alturas heladas.",
        "price_cents": 220,
        "category_slug": "cafes",
        "ingredients": ["Café arábica", "Agua"],
        "is_available": True,
        "is_featured": True,
        "inspiration_pokemon_name": "Piloswine",
        "inspiration_pokedex_text": "Un Pokémon de las cumbres nevadas, cubierto de un pelaje espeso que lo protege del frío extremo.",
        "inspiration_story": "Este espresso lleva su nombre por lo alto que \"sube\" su intensidad, igual que Piloswine resistiendo en la cima de Monte Corona.",
    },
    {
        "slug": "latte-piplup",
        "name": "Latte Piplup",
        "description": "Café suave con leche vaporizada y un toque de vainilla, en capas como las olas del lago.",
        "price_cents": 320,
        "category_slug": "cafes",
        "ingredients": ["Café arábica", "Leche", "Vainilla"],
        "is_available": True,
        "is_featured": True,
        "inspiration_pokemon_name": "Piplup",
        "inspiration_pokedex_text": "Un pequeño Pokémon pingüino, orgulloso y decidido, que no soporta que le ayuden a comer.",
        "inspiration_story": "El azul suave de este latte recuerda al plumaje de Piplup asomando entre las nubes de espuma.",
    },
    {
        "slug": "capuchino-ruta-201",
        "name": "Capuchino Ruta 201",
        "description": "Espresso con espuma cremosa y un dibujo de hojas, como el paisaje de los primeros caminos de Sinnoh.",
        "price_cents": 280,
        "category_slug": "cafes",
        "ingredients": ["Café arábica", "Leche"],
        "is_available": True,
        "is_featured": False,
        "location_name": "Ruta 201",
        "location_description": "Un camino tranquilo entre campos de hierba, de los primeros que recorre cualquier viajero al salir de su pueblo.",
    },
    {
        "slug": "te-helado-lago-verity",
        "name": "Té helado Lago Verity",
        "description": "Té negro frío con un toque cítrico, servido con hielo y una rodaja de naranja.",
        "price_cents": 250,
        "category_slug": "bebidas",
        "ingredients": ["Té negro", "Limón", "Azúcar de caña"],
        "is_available": True,
        "is_featured": True,
        "location_name": "Lago Verity",
        "location_description": "Un lago pequeño y sereno, célebre por sus aguas cristalinas y su silencio al amanecer.",
    },
    {
        "slug": "chocolate-chimchar",
        "name": "Chocolate Chimchar",
        "description": "Chocolate caliente con un toque de canela y un puntito picante, para entrar en calor.",
        "price_cents": 300,
        "category_slug": "bebidas",
        "ingredients": ["Cacao", "Leche", "Canela"],
        "is_available": True,
        "is_featured": False,
        "inspiration_pokemon_name": "Chimchar",
        "inspiration_pokedex_text": "Un Pokémon mono de fuego con una llama que arde en su cola sin apagarse nunca, ni con la lluvia.",
        "inspiration_story": "El toque picante de este chocolate es un guiño a la llama que Chimchar siempre lleva encendida.",
    },
    {
        "slug": "bocadillo-ciudad-jubileo",
        "name": "Bocadillo Ciudad Jubileo",
        "description": "Pan artesano con jamón, queso curado y rúcula, pensado para un almuerzo rápido y completo.",
        "price_cents": 480,
        "category_slug": "bocadillos",
        "ingredients": ["Pan", "Jamón", "Queso", "Rúcula"],
        "is_available": True,
        "is_featured": False,
        "location_name": "Ciudad Jubileo",
        "location_description": "Una ciudad bulliciosa y luminosa, cruce de caminos donde se encuentran viajeros de toda la región.",
    },
    {
        "slug": "tosta-ruta-212",
        "name": "Tosta Ruta 212",
        "description": "Tosta de pan de masa madre con aguacate, tomate seco y semillas.",
        "price_cents": 420,
        "category_slug": "bocadillos",
        "ingredients": ["Pan de masa madre", "Aguacate", "Tomate seco", "Semillas"],
        "is_available": False,
        "is_featured": False,
        "location_name": "Ruta 212",
        "location_description": "Un camino largo entre huertos y jardines, popular por sus vistas y su ambiente relajado.",
    },
    {
        "slug": "tarta-lago-valor",
        "name": "Tarta Lago Valor",
        "description": "Tarta de queso al horno con base de galleta y un toque de limón.",
        "price_cents": 380,
        "category_slug": "pasteles",
        "ingredients": ["Queso crema", "Galleta", "Limón", "Huevo"],
        "is_available": True,
        "is_featured": True,
        "location_name": "Lago Valor",
        "location_description": "Un lago más agreste y profundo, rodeado de roca y corrientes frías, asociado a la fuerza y la determinación.",
    },
    {
        "slug": "cheesecake-glaceon",
        "name": "Cheesecake Glaceon",
        "description": "Tarta de queso fría con topping de frutos rojos, fresca y ligera.",
        "price_cents": 400,
        "category_slug": "pasteles",
        "ingredients": ["Queso crema", "Nata", "Frutos rojos"],
        "is_available": True,
        "is_featured": False,
        "inspiration_pokemon_name": "Glaceon",
        "inspiration_pokedex_text": "Un Pokémon que controla el frío a voluntad, capaz de congelar el aire a su alrededor.",
        "inspiration_story": "Este cheesecake se sirve bien frío, como un guiño al frescor característico de Glaceon.",
    },
    {
        "slug": "galletas-bidoof",
        "name": "Galletas Bidoof",
        "description": "Galletas de mantequilla, sencillas y reconfortantes, perfectas para acompañar un café.",
        "price_cents": 180,
        "category_slug": "dulces",
        "ingredients": ["Harina", "Mantequilla", "Azúcar"],
        "is_available": True,
        "is_featured": False,
        "inspiration_pokemon_name": "Bidoof",
        "inspiration_pokedex_text": "Un Pokémon sencillo y constante, de dientes fuertes que roe madera sin descanso y rara vez se altera por nada.",
        "inspiration_story": "Estas galletas, sencillas y reconfortantes, comparten el carácter tranquilo y sin complicaciones de Bidoof.",
    },
    {
        "slug": "trufas-munchlax",
        "name": "Trufas Munchlax",
        "description": "Trufas de chocolate negro rellenas de praliné, en ración generosa.",
        "price_cents": 260,
        "category_slug": "dulces",
        "ingredients": ["Chocolate negro", "Praliné", "Cacao en polvo"],
        "is_available": True,
        "is_featured": False,
        "inspiration_pokemon_name": "Munchlax",
        "inspiration_pokedex_text": "Un Pokémon que esconde comida entre su pelaje para picar más tarde, y come todo el día sin parar.",
        "inspiration_story": "La ración generosa de estas trufas está pensada para quien, como Munchlax, siempre tiene hueco para un dulce más.",
    },
    {
        "slug": "pack-explorador-sinnoh",
        "name": "Pack Explorador Sinnoh",
        "description": "Café, tosta y un dulce a elegir, pensado para quienes exploran la región con calma.",
        "price_cents": 890,
        "category_slug": "packs",
        "ingredients": ["Varía según elección"],
        "is_available": True,
        "is_featured": True,
        "location_name": "Región de Sinnoh",
        "location_description": "Un recorrido pensado para explorar de punta a punta: montañas, lagos y ciudades en un mismo pack.",
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        categories_by_slug: dict[str, Category] = {}
        for data in CATEGORIES:
            existing = db.query(Category).filter(Category.slug == data["slug"]).first()
            if existing is None:
                existing = Category(**data)
                db.add(existing)
                db.flush()  # asigna el id sin cerrar la transacción todavía
            categories_by_slug[data["slug"]] = existing

        for data in PRODUCTS:
            # Ilustración servida por el frontend (frontend/public/products),
            # generada con scripts/prepare_product_images.py.
            image_url = f"/products/{data['slug']}.webp"
            existing = db.query(Product).filter(Product.slug == data["slug"]).first()
            if existing is not None:
                # Solo rellena la imagen si falta: no pisa la que haya puesto
                # un admin desde el panel.
                if existing.image_url is None:
                    existing.image_url = image_url
                continue
            # Copia sin "category_slug": hacer pop() sobre data modificaba la
            # lista PRODUCTS y una segunda siembra en el mismo proceso (el
            # reinicio de la demo) fallaba con KeyError.
            fields = {key: value for key, value in data.items() if key != "category_slug"}
            product = Product(category_id=categories_by_slug[data["category_slug"]].id, image_url=image_url, **fields)
            db.add(product)

        db.commit()
        print(f"Categorías: {len(CATEGORIES)}. Productos: {len(PRODUCTS)}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()