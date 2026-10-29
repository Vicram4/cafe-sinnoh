# Café Sinnoh: estado del proyecto

Documento de situación a fecha de 29 de octubre de 2026. Resume lo construido hasta el cierre de la FASE 12, la subida de CV, el testing y el bloque de seguridad y optimización, y lo que queda por hacer. Sustituye al checkpoint inicial en lo que respecta al estado del código.

## 1. Qué es

Aplicación web Full-Stack para una cafetería artesanal ficticia, construida como proyecto de portfolio. La marca se inspira sutilmente en la región de Sinnoh (Pokémon) como lugar: montañas, Monte Corona, bosques, frío. Nunca como fan page, y sin assets oficiales.

## 2. Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS v4, React Router v8, TanStack React Query, react-hook-form + zod, Oxlint.
- **Backend:** Python 3.14, FastAPI + Uvicorn, SQLAlchemy síncrono + psycopg3, Alembic, pwdlib (argon2), PyJWT, pydantic-settings.
- **Base de datos:** PostgreSQL 17 en Docker Compose (solo el servicio db).
- **Testing:** pytest + httpx2 (backend); Vitest + jsdom + Testing Library (frontend).

## 3. Lo construido

**Público:** Home con ilustración propia, carta con búsqueda/filtro/orden, detalle de producto (inspiración Pokémon o lugar), carrito, checkout con validación de horario, login y registro, zona de cuenta (datos, pedidos, puntos y recompensas), reseñas, careers, contact.

**Backend:** autenticación JWT con roles USER/ADMIN, catálogo, pedidos con máquina de estados, ledger de puntos y recompensas, reseñas con elegibilidad por compra, candidaturas y mensajes de contacto.

**Panel de administración (FASE 12, completa), 7 apartados:**

| Apartado | Funciones |
|---|---|
| Dashboard | Estadísticas generales |
| Pedidos | Listar, filtrar por estado, avanzar o cancelar |
| Productos | Crear, editar, activar/desactivar, eliminar |
| Reseñas | Moderar (aprobar o rechazar), abre en pendientes |
| Candidaturas | Cambiar estado (nueva, revisada, contactada, rechazada), descargar CV |
| Mensajes | Marcar como leído o sin leer |
| Usuarios | Cambiar rol, desactivar y reactivar |

## 4. Historial de commits de la FASE 12

| Bloque | Backend | Frontend |
|---|---|---|
| 1. Layout y dashboard | `89bc6cc` | `f8bdfff` |
| 2. Pedidos | `4336298` | `505b7d3` |
| 3. Productos | `4aa7ced` | `99d1634` |
| 4. Reseñas | `f9c9337` | `09c63dd`, corrección `556722b` |
| 5. Candidaturas y mensajes | `0200bf9` | `8fc99da` |
| 6. Usuarios | `4c05fe0` | `0466ac2` |
| Documentación | | `1ccf139` |

## 5. Endpoints añadidos en la FASE 12

- `POST /products`, `PATCH /products/{id}`, `DELETE /products/{id}`
- `GET /reviews/admin/all`
- `PATCH /careers/applications/{id}/status`
- `PATCH /contact/{id}`
- `GET /admin/users`, `PATCH /admin/users/{id}`
- `GET /orders/admin/all`

## 5 bis. Subida de CV (completa)

Commits: `29dc50d` (backend) y `be504c2` (frontend).

- `POST /careers/applications` pasa a `multipart/form-data` con un archivo `cv` opcional.
- Solo PDF (extensión, content-type y firma `%PDF-`), máximo 5 MB. Errores 415, 413 y 400.
- Contenido en la tabla `stored_files` con clave aleatoria, a través de `app/services/storage.py` (al principio iban en `backend/uploads/cvs/`; se pasaron a la BD para el deployment gratuito).
- `GET /careers/applications/{id}/cv`, solo admin. El panel lo descarga con fetch y token.
- El formulario público recomienda adjuntar el CV sin obligar a hacerlo.

## 5 ter. Testing (completo)

Commits: `a8eb922` + `a676b0f` (backend) y `cd0f143` + `b89f34a` (frontend).

| Parte | Tests | Qué cubren |
|---|---|---|
| Backend (`pytest`) | 81 (85 tras seguridad) | Autenticación, pedidos y máquina de estados, puntos y canjes, los 15 endpoints de admin (403/401), autoprotección del admin, subida y descarga de CV |
| Frontend (`npm test`) | 18 (24 tras seguridad) | Formato de precios, cliente de la API (JSON, FormData, token, errores, descargas), formulario de candidaturas |

- Los tests de backend usan una base de datos aparte, `cafe_sinnoh_test`, con las migraciones reales. No arrancan si el nombre no termina en `_test`.
- Se comprobó que los tests fallan de verdad: se metieron errores a propósito en el código y los detectaron.

## 5 quater. Seguridad y optimización (completo)

Commits: `958cd82`, `8b41b4d` (backend), `d16e8dc`, `8fbfe5e` (frontend).

| Cambio | Resultado |
|---|---|
| `SECRET_KEY` | La app no arranca con claves de menos de 32 bytes, en ningún entorno. Los errores de configuración ya no muestran secretos. |
| Dependencias | `pip-audit` y `npm audit` sin vulnerabilidades (se actualizaron dnspython, vite, zod y source-map-js). `requirements.txt` en UTF-8. |
| Carrito | Uno por cuenta y otro sin sesión. Al entrar, se incorpora el carrito sin sesión sin duplicar cantidades. |
| Code splitting | JS inicial de 549 KB a 265 KB (82 KB comprimido). El panel de admin solo lo descarga quien entra en él. Página de error propia si una página no carga. |
| Límite de login | 5 fallos por cuenta+IP o 20 por IP en 15 minutos bloquean el login (429), incluso con la contraseña correcta. Una persona no puede bloquear la cuenta de otra. No se guardan emails en claro. 8 tests. |

El código está en GitHub, en un repositorio privado (`Vicram4/cafe-sinnoh`).

## 5 quinquies. Docker completo

Commits: `ca4e3fa` (backend), `ab351f8` (frontend y nginx), `248b2cd` (Compose).

- `docker compose --profile app up -d --build` arranca toda la app en `http://localhost:8080`. Sin el perfil, solo arranca la base de datos, como antes.
- nginx sirve la web compilada y reenvía `/api` al backend, en el mismo origen y sin CORS. Solo nginx publica un puerto.
- El backend aplica las migraciones al arrancar, no se ejecuta como root y recibe la IP real del cliente (necesaria para el límite de login).
- Comprobado: subida de CVs de más de 1 MB a través de nginx, recarga en rutas internas, caché correcta y cabeceras de seguridad.
- También se corrigió `index.html`: título "Café Sinnoh" e idioma español.

## 5 sexies. Cabecera, tema y GitHub

- **Cabecera:** con sesión iniciada, los textos se partían y se pegaban ("ContactoClaro"). Ahora va en una sola fila desde 1024 px y, por debajo, se usa el menú desplegable. Comprobado en un navegador real en el peor caso (admin, nombre largo y "Carrito (12)").
- **Tema:** el selector de tres opciones se sustituyó por un interruptor claro/oscuro con la estética de la marca (rectangular, sin sombras). La primera vez sigue el modo del sistema operativo.
- **README** en español (principal) y en inglés. Se comprobó siguiéndolo paso a paso sobre un clon limpio del repositorio.
- **CI con GitHub Actions:** tests, lint, build, auditorías de dependencias e imágenes Docker en cada push. Se simuló antes en contenedores Linux limpios.
- **Tests:** 93 de backend y 27 de frontend.

## 5 septies. Sesión persistente al recargar

Commits: `354f412` (backend) y `bd70fde` (frontend).

- Al pulsar F5 ya no se pierde la sesión. El token principal sigue solo en memoria; lo que sobrevive es un token de renovación en una cookie que JavaScript no puede leer.
- Cada renovación invalida el token anterior. Si alguien reutiliza uno ya usado, se cierra toda la sesión. "Salir" la cierra también en el servidor.
- Funciona con varias pestañas a la vez, sin que el sistema lo confunda con un robo.
- Comprobado en un navegador real, tanto en desarrollo como en Docker.
- **Tests:** 102 de backend y 34 de frontend.

## 5 octies. Seguridad básica y revisiones automáticas

Commits: `dd1447d` (backend), `c55c3ea` (frontend) y `4342271` (Dependabot y CI semanal).

- Contraseñas de 8 caracteres como mínimo, sin aceptar las más comunes ni las que contienen el email.
- Registro, contacto y empleo con límite de envíos por IP y un campo trampa invisible contra bots.
- Los campos del registro tienen límites de longitud (antes un nombre muy largo provocaba un error 500).
- Dependabot propone cada semana las actualizaciones de dependencias, y la CI se ejecuta también cada lunes.
- Página "Nosotros" (antes provisional) y páginas propias de "no encontrado". El login enlaza con el registro, y un producto inexistente se indica al momento, sin 7 s de "Cargando…".
- **Tests:** 117 de backend y 38 de frontend.

## 5 nonies. Modo demo, aviso legal y fuentes propias

Commits: `e9db6fc`, `23951d1`, `01522f0`, `6692e37` y `601a9e7`.

- **Modo demo:** botones "Entrar como cliente" y "Entrar como admin" en el login, con datos de ejemplo (pedidos, puntos, reseñas y bandeja del admin), y una franja que avisa de que es una demo. Un comando devuelve la demo a su estado inicial; solo funciona con el modo demo activado, para no borrar nunca datos reales.
- **Aviso legal y privacidad**, proporcionado a un proyecto de fans sin ánimo de lucro, enlazado desde el pie y los formularios. El correo de contacto es el del proyecto, no el personal.
- **Fuentes servidas desde la propia web:** ya no se envía la IP de los visitantes a Google.
- Corregidos dos fallos de los scripts de datos que solo aparecían al ejecutarlos como comandos o dos veces seguidas.
- **Tests:** 122 de backend y 41 de frontend.

## 5 decies. SEO mínimo

Commit: `00138ab`.

- La web no aparece en Google (decisión del autor, para mantener un perfil bajo por el tema Pokémon). Se llega por enlace directo.
- Cada página tiene su título en la pestaña ("Carta · Café Sinnoh").
- Vista previa preparada para compartir el enlace en LinkedIn o WhatsApp, con su propia imagen. La dirección de la imagen se completa al publicar.
- Icono propio en la pestaña (antes era el logo de Vite).
- **Tests:** 125 de backend y 44 de frontend.

## 5 undecies. Ilustraciones de producto

Commits: `63a05c7` y `da8c8af`.

- Las 12 ilustraciones, generadas con IA a partir de una guía de estilo común, muestran el producto inspirado y nunca un personaje.
- Se retocaron tres "firmas" falsas que había añadido la IA, y se corrigieron el fondo y una sombra lateral para que encajen con la web.
- Pesan unos 28 KB cada una y se cargan solo al acercarse a ellas en la carta.

## 5 duodecies. Nuevo hero

Commit: `939ab92`.

- La montaña geométrica plana de la portada se sustituyó por una ilustración en el mismo estilo que los productos (montañas nevadas, bosque y lago).
- Se mantiene la animación: un sendero que sube en zigzag por la ladera hasta la cumbre, trazado para que no pise el lago ni los árboles.
- Con "reducir movimiento", el sendero y el punto de la cumbre aparecen ya completos.

## 6. Decisiones vigentes

- Monorepo con frontend y backend separados.
- SQLAlchemy síncrono.
- Sesión: token principal solo en memoria y token de renovación en cookie `HttpOnly` con rotación. La sesión se mantiene al recargar.
- Es un proyecto personal de fans sin ánimo de lucro, no un negocio: lo legal y el SEO se hacen en proporción a eso. La web no se indexará en Google.
- `get_current_user` consulta siempre la base de datos y rechaza cuentas desactivadas en cada petición.
- snake_case idéntico en frontend y backend.
- Dinero siempre en céntimos.
- Un producto con pedidos no se borra: se desactiva (`is_available = false`). El borrado devuelve 409.
- Un admin no puede cambiar su propio rol ni desactivarse. No hay borrado de usuarios.
- Regla Pokémon o lugar: cada producto tiene uno de los dos grupos, nunca ambos. Lo valida `services/products.py`, no la base de datos.
- Candidaturas y mensajes: cambio de estado manual, sin máquina de estados.
- CRM y marketing: fase futura separada. No se prepara nada por adelantado.

## 7. Siguiente trabajo

1. Deployment (incluye HTTPS y la Content-Security-Policy).
2. Opcional: login con Google.
3. Capturas, hacer público el repositorio y revisión final del portfolio.

## 8. Deudas conocidas

- El carrito sigue en localStorage (uno por cuenta): no se comparte entre dispositivos.
- Revisar los textos de la página "Nosotros" (borrador inicial).
- Incidencia sin explicar: una vez apareció `QueuePool limit of size 5 overflow 10 reached`. Si vuelve, antes de reiniciar uvicorn ejecutar `select state, count(*) from pg_stat_activity where datname = current_database() group by state;` y guardar el resultado.

## 9. Lecciones del trabajo hasta ahora

- La mayoría de los tropiezos fueron de carpeta o archivo equivocado (terminal en la carpeta incorrecta, enlaces de admin pegados en `AccountLayout.tsx` en vez de `AdminLayout.tsx`). Un `git status` antes de cada commit lo detecta.
- Generar y aplicar las migraciones de Alembic en el mismo paso.
- Un commit sin `npm run build` y `npm run lint` previos deja errores sin detectar.
- No hay que fiarse de salidas pegadas fuera de orden: comprobar antes de asumir un fallo.
- En Windows, `localhost` en `DATABASE_URL` hacía que cada conexión nueva tardase más de 8 s. Se usa `127.0.0.1`.
- La documentación web de una librería puede ir por delante de la versión instalada (pasó con FastAPI y los modelos `Form()`): si algo no cuadra, comprobar el código de la versión instalada.
- Un test que nunca ha fallado no demuestra nada: romper el código a propósito una vez confirma que lo vigila.
- En Docker, los fallos más traicioneros vienen de valores por defecto que no se ven: nginx limita los envíos a 1 MB, resuelve los nombres de host solo al arrancar y un `add_header` en un `location` borra los del `server`. Hay que probar el caso real (un CV de más de 1 MB) y no solo que la web carga.

## 10. Estado de la herramienta de trabajo

El desarrollo ha pasado de claude.ai (el usuario ejecutaba los comandos) a Claude Code (que trabaja sobre los archivos). El contexto se traspasa mediante `CLAUDE.md` en la raíz del repositorio. Claude Code no lee el historial de los chats anteriores.
