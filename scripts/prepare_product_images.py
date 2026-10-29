"""Prepara las ilustraciones de producto para la web.

Uso (requiere Pillow, que no forma parte de las dependencias del proyecto):
    pip install pillow
    python scripts/prepare_product_images.py <carpeta_con_originales>

Cada original debe llamarse como el slug del producto (p. ej.
latte-piplup.png). Para cada uno:
1. Recorta un margen fino: las IA dejan a veces una franja gris en un borde,
   como el canto de una hoja escaneada. El recorte es igual en los cuatro
   lados para que la imagen siga cuadrada y centrada.
2. Corrige la sombra lateral (campo plano): además de la franja, las IA
   oscurecen a menudo los bordes como en un escaneo. En las bandas de arriba
   y abajo solo hay papel, así que de ahí se mide cuánto se oscurece cada
   columna respecto al centro, y se aclara en esa proporción.
3. Ajusta el tono para que el fondo coincida con el crema de la web
   (#F1E9DA): cada IA genera un crema ligeramente distinto.
4. Reduce a 640x640 y guarda en WebP en frontend/public/products/.
   640 px basta para la tarjeta de la carta (~300 px en pantallas de alta
   densidad) y la ficha del producto, con archivos ligeros.
"""

import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

TARGET_BACKGROUND = (0xF1, 0xE9, 0xDA)
MARGIN_RATIO = 0.012  # ~24 px en un original de 2048 px
SIZE = 640
OUTPUT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "products"


def background_color(image: Image.Image) -> tuple[float, float, float]:
    """Mediana de una banda junto a los bordes, donde solo hay papel."""
    w, h = image.size
    band = max(w // 20, 1)
    strips = [image.crop((0, 0, w, band)), image.crop((0, h - band, w, h))]
    medians = [ImageStat.Stat(strip).median for strip in strips]
    return tuple(sum(channel) / len(medians) for channel in zip(*medians))


def flatten_columns(image: Image.Image) -> Image.Image:
    """Aclara las columnas más oscuras que el papel del centro (sombra de
    escaneo). Solo corrige diferencias de más del 1 %, para no tocar nada más."""
    w, h = image.size
    band = max(h // 20, 1)
    paper = Image.new("RGB", (w, 2 * band))
    paper.paste(image.crop((0, 0, w, band)), (0, 0))
    paper.paste(image.crop((0, h - band, w, h)), (0, band))
    # Perfil de cada columna: media vertical, suavizada para ignorar motas.
    profile = paper.resize((w, 1), Image.BOX).filter(ImageFilter.BoxBlur(3)).load()
    reference = paper.crop((w // 3, 0, 2 * w // 3, 2 * band)).resize((1, 1), Image.BOX).getpixel((0, 0))
    gains = []
    for x in range(w):
        column = profile[x, 0]
        gains.append(tuple(max(1.0, ref / col) if ref / col > 1.01 else 1.0 for ref, col in zip(reference, column)))
    if all(g == (1.0, 1.0, 1.0) for g in gains):
        return image
    pixels = image.load()
    for x, (gr, gg, gb) in enumerate(gains):
        if (gr, gg, gb) == (1.0, 1.0, 1.0):
            continue
        for y in range(h):
            r, g, b = pixels[x, y]
            pixels[x, y] = (min(255, round(r * gr)), min(255, round(g * gg)), min(255, round(b * gb)))
    return image


def prepare(source: Path) -> Path:
    image = Image.open(source).convert("RGB")
    w, h = image.size
    margin = round(min(w, h) * MARGIN_RATIO)
    side = min(w, h) - 2 * margin
    image = flatten_columns(image.crop((margin, margin, margin + side, margin + side)))

    factors = [target / current for target, current in zip(TARGET_BACKGROUND, background_color(image))]
    bands = [band.point(lambda value, f=f: min(255, round(value * f))) for band, f in zip(image.split(), factors)]
    image = Image.merge("RGB", bands).resize((SIZE, SIZE), Image.LANCZOS)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT / f"{source.stem}.webp"
    image.save(destination, "WEBP", quality=82, method=6)
    return destination


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Uso: python scripts/prepare_product_images.py <carpeta_con_originales>")
    for path in sorted(Path(sys.argv[1]).iterdir()):
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            result = prepare(path)
            print(f"{path.name} -> {result.name} ({result.stat().st_size // 1024} KB)")
