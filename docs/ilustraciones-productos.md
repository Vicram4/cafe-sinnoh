# Ilustraciones de los productos (guía para generarlas con IA)

## La idea

Cada imagen muestra **el producto**, no un personaje. La inspiración se nota
en los colores, la luz y el ambiente (hielo, montaña, lago, calidez). Los
nombres de Pokémon se quedan solo en el texto y en el panel con aviso legal.

## Antes de empezar

- **Herramienta:** cualquiera que genere imágenes (ChatGPT, Gemini, Adobe
  Firefly, Midjourney…). Revisa sus condiciones de uso y comprueba que te
  permiten usar las imágenes libremente en una web. Adobe afirma que Firefly
  está entrenado con contenido con licencia, lo que reduce riesgos; no está
  confirmado que eso valga igual para el resto.
- **Nunca** escribas nombres de Pokémon en las instrucciones: la IA podría
  dibujar algo parecido al personaje.
- **Formato:** cuadrado (1:1), mínimo 1024×1024 px, en PNG o JPG.

## Cómo conseguir que las 12 parezcan una colección

1. Empieza por **una sola imagen** (por ejemplo, el Capuchino Ruta 201) y
   repítela hasta que el estilo te guste de verdad.
2. Para el resto, pega **siempre el mismo bloque de estilo** + la descripción
   del producto.
3. Si la herramienta lo permite, adjunta esa primera imagen como
   **referencia de estilo** ("usa esta imagen como referencia de estilo").
4. Genera 3 o 4 variantes de cada producto y quédate con la mejor.

## Bloque de estilo (copiar siempre, al principio)

Las instrucciones van en inglés porque la mayoría de herramientas las
entienden mejor así.

```
Hand-drawn editorial illustration in a travel-sketchbook style: flat gouache
and ink textures, subtle paper grain, limited muted palette — warm cream
background (#F1E9DA), deep pine green (#2E4235), coffee brown (#6E4B34),
slate blue (#54687A) and a small touch of burnt orange (#A8522E). Soft
natural light, matte finish, no glossy 3D render look. A single product,
centered, seen in three-quarter view from slightly above, with generous empty
space around it on a plain cream background. Square format 1:1.
No text, no letters, no logos, no people, no hands, no animals, no
characters, no faces, no mascots.
```

## Descripción de cada producto (pegar después del bloque de estilo)

| Producto | Archivo | Descripción para la IA | Qué evoca |
|---|---|---|---|
| Espresso Monte Corona | `espresso-monte-corona` | `Subject: a small espresso cup on a saucer with thick dark crema, a faint wisp of steam, and behind it, very subtle, the outline of a tall snowy mountain peak.` | Montaña helada |
| Latte Piplup | `latte-piplup` | `Subject: a tall glass latte with soft layers of milk and coffee and a pale blue-and-white foam top like gentle waves, a few small ice-like sparkles around the glass.` | Azul y frío del lago |
| Capuchino Ruta 201 | `capuchino-ruta-201` | `Subject: a wide cappuccino cup with leaf latte art, resting on a small wooden board, with a few blades of green grass at the base.` | Camino entre campos |
| Té helado Lago Verity | `te-helado-lago-verity` | `Subject: a tall glass of iced black tea with ice cubes and a lemon slice, its surface catching soft reflections like a calm lake at dawn.` | Lago sereno al amanecer |
| Chocolate Chimchar | `chocolate-chimchar` | `Subject: a mug of thick hot chocolate with a cinnamon stick and a tiny pinch of red chili flakes on top, warm orange glow around the mug.` | Calidez y fuego |
| Bocadillo Ciudad Jubileo | `bocadillo-ciudad-jubileo` | `Subject: a rustic artisan bread sandwich with cured ham, aged cheese and rocket leaves, cut in half on a paper wrap.` | Ciudad animada, almuerzo |
| Tosta Ruta 212 | `tosta-ruta-212` | `Subject: a slice of sourdough toast topped with mashed avocado, sun-dried tomatoes and seeds, on a small plate with a few fresh herbs.` | Huertos y jardines |
| Tarta Lago Valor | `tarta-lago-valor` | `Subject: a slice of baked cheesecake with a golden top and biscuit base, a thin lemon twist, on a slate-grey stone plate.` | Lago de roca y agua fría |
| Cheesecake Glaceon | `cheesecake-glaceon` | `Subject: a slice of chilled no-bake cheesecake topped with red berries, a few delicate frost crystals on the plate, cool pale-blue shadows.` | Frescor y hielo |
| Galletas Bidoof | `galletas-bidoof` | `Subject: a small stack of simple round butter cookies on a plain linen napkin next to a cup of coffee.` | Sencillo y reconfortante |
| Trufas Munchlax | `trufas-munchlax` | `Subject: a generous pile of dark chocolate truffles dusted with cocoa powder in a small paper box.` | Ración generosa |
| Pack Explorador Sinnoh | `pack-explorador-sinnoh` | `Subject: a coffee cup, a slice of avocado toast and a cookie arranged on a wooden tray, with a small folded paper map beside them.` | Viaje y exploración |

## Revisa cada imagen antes de quedártela

- [ ] No hay texto, letras ni logotipos, ni siquiera garabatos que lo parezcan.
- [ ] No hay ningún animal, cara ni personaje, aunque sea escondido (en la
      espuma, en el humo, en las sombras).
- [ ] No hay ningún objeto que recuerde a una Poké Ball (esfera roja y blanca
      con una franja negra).
- [ ] El estilo y los colores encajan con las imágenes que ya tienes.
- [ ] El producto se reconoce de un vistazo, también en pequeño (en la carta se
      ve a unos 250 px).

## Cómo me las pasas

Guarda cada imagen con el nombre de la columna "Archivo", por ejemplo
`latte-piplup.png`, en la carpeta `frontend/public/products/` (créala si no
existe). Puedes ir pasándolas poco a poco.

Después, Claude:
1. Revisa cada imagen con la lista de arriba.
2. La convierte a WebP, más ligero, en el tamaño que usa la web.
3. Le añade un texto alternativo que describa el producto (accesibilidad).
4. La asigna al producto en la base de datos y en los datos de la demo.
