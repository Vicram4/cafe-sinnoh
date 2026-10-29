# Café Sinnoh: contexto para Claude Code

Aplicación web Full-Stack para una cafetería ficticia, proyecto de portfolio profesional. Marca: cafetería artesanal con identidad propia, inspirada sutilmente en la región de Sinnoh (Pokémon) como lugar (montañas, Monte Corona, bosques, frío). Nunca como fan page. Nunca usar assets oficiales de Pokémon.

El dueño tiene formación DAW y Marketing, y lleva ~1 año sin desarrollar de forma habitual. Quiere aprender tecnologías actuales y poder explicar el proyecto en entrevistas.

## Reglas de trabajo (respetar siempre)

- Responder y explicar SIEMPRE en español.
- Trabajo incremental: bloques sustanciales pero verificables (backend primero, probar en /docs, luego frontend, probar en navegador). Nunca generar el proyecto entero de golpe.
- Commits pequeños, separados backend/frontend, con prefijos feat:/fix:/docs:/chore:/test:/refactor:.
- Commits y push (desde 2026-10-29, a petición del usuario): commitear SIN esperar confirmación cuando build, lint y tests estén en verde, mostrando el `git status` y lo que entra en cada commit. Hacer push a GitHub al cerrar cada bloque. SÍ hay que pedir: comprobaciones manuales (con pasos numerados), la opinión del usuario en decisiones con alternativas reales y confirmación antes de acciones difíciles de deshacer (borrar datos, reescribir historial/force push, hacer público el repo, desplegar). Antes de commitear frontend: `npm run build`, `npm run lint` y `npm test` limpios (desde la carpeta frontend), sin avisos (el de bundle >500 KB ya está resuelto; no subir `chunkSizeWarningLimit` para esconderlo). Antes de commitear backend: `pytest`.
- Comprobar siempre que `.venv`, `.env` y `node_modules` NUNCA se suban.
- Comentarios de código solo cuando expliquen lógica, arquitectura o seguridad importantes. Nunca comentarios obvios.
- Verificar la documentación actual de una librería antes de usarla; no fiarse de memoria desactualizada.
- Revisar el contenido de las migraciones de Alembic antes de aplicarlas. Generar Y aplicar la migración en el mismo paso, nunca solo una. No generar una nueva si la BD no está al día (`alembic upgrade head` primero).
- No inventar información. Si algo es incierto, decirlo como "no confirmado".
- NO rehacer lo ya construido ni proponer alternativas a las decisiones de abajo sin que el usuario lo pida.
- Al modificar un archivo existente, dar cambios completos y precisos; ojo con archivos parecidos (error ya ocurrido: se editó AccountLayout.tsx en vez de AdminLayout.tsx).
- Si el usuario pega salidas de terminal en orden raro, comprobarlo antes de asumir un fallo.

## Stack real (no sustituir)

Frontend (carpeta `frontend/`): React + TypeScript + Vite; Tailwind CSS v4 (CSS-first con @theme, sin tailwind.config.js; dark mode manual vía @custom-variant); React Router v8 (`react-router` 8.5.1+, createBrowserRouter, páginas con `lazy`); TanStack React Query; react-hook-form + zod + @hookform/resolvers/zod; Oxlint (NO ESLint); fuentes Fraunces + Work Sans.

Backend (carpeta `backend/`, entorno `.venv` propio): Python 3.14; FastAPI + Uvicorn; pydantic-settings; SQLAlchemy 2.x SÍNCRONO (no async) + psycopg3 (`psycopg[binary]`, no psycopg2); Alembic; pwdlib[argon2] (NO passlib); PyJWT (NO python-jose); python-multipart; email-validator.

BD: PostgreSQL 17 (postgres:17-alpine) en Docker Compose (solo servicio db, contenedor `cafe-sinnoh-db`, puerto 5432 solo en 127.0.0.1).

NO se usa: passlib, python-jose, psycopg2, SQLAlchemy async, librerías de animación, librerías de calendario, Radix ni otra librería de diálogos (SidePanel hecho a mano).

Testing: backend con pytest 9.2 + httpx2 (lo pide el TestClient de Starlette 1.7) en `requirements-dev.txt`; frontend con Vitest 5 + jsdom + Testing Library (react, dom, jest-dom 7, user-event), `globals` desactivado (imports explícitos y cleanup en `src/test/setup.ts`).

## Entorno del usuario

Windows + PowerShell 5.1, monorepo en `C:\dev\cafe-sinnoh`. Los caracteres raros (Ã³) al leer archivos con Get-Content son solo codificación de PowerShell; los archivos deben guardarse en UTF-8. Los avisos "CRLF will be replaced by LF" son cosméticos. Comandos de npm siempre desde `frontend/`; uvicorn, alembic y pip desde `backend/` con `.venv` activo (`.\.venv\Scripts\Activate.ps1`). Antes de probar en desarrollo: Docker (PostgreSQL), uvicorn (`uvicorn app.main:app --reload`) y `npm run dev` deben estar en marcha (web en :5173). Alternativa: toda la app en Docker con `docker compose --profile app up -d --build` (web en :8080). Ambas comparten BD y CVs y pueden convivir. Tras cambios de código, la versión Docker solo se actualiza volviendo a ejecutar ese comando.

## Arquitectura

Backend: `app/core` (config.py, security.py), `app/db` (base_class, base, session), `app/models` (un archivo por entidad, SQLAlchemy tipado Mapped[...]), `app/schemas` (Pydantic, nunca exponen password_hash), `app/api/v1` (routers + deps.py con get_current_user/require_admin), `app/services` (lógica de negocio pura; excepción OrderValidationError reutilizada), `app/seed` (scripts idempotentes: `python -m app.seed.seed_products`, `seed_rewards`). API versionada bajo /api/v1.

Frontend: `src/context` + `src/hooks` (Contexts en patrón fijo de 3 archivos: xxx-context.ts, XxxContext.tsx, hooks/useXxx.ts), `src/services/api` (client.ts centralizado con api.get/post/patch/delete y clase ApiError), `src/types`, `src/components`, `src/layouts` (PublicLayout, AccountLayout, AdminLayout), `src/pages`, `src/utils/format.ts`.

## Decisiones tomadas (no cambiar sin consultar)

- Monorepo frontend/backend con entornos separados.
- SQLAlchemy síncrono.
- JWT solo access token, SOLO en memoria (React state), nunca localStorage/cookie; se pierde la sesión al recargar (F5) y NO es un bug. Decisión definitiva de sesión aplazada a la fase de deployment.
- get_current_user SIEMPRE consulta la BD (rol y is_active surten efecto inmediato). Rechaza cuentas desactivadas (403) en cada petición.
- snake_case idéntico en backend y frontend, sin capa de traducción.
- Dinero siempre en céntimos (entero).
- Login usa application/x-www-form-urlencoded (OAuth2); el resto JSON.
- Reseñas: solo sobre productos con pedido COMPLETED, una por producto, pendientes de aprobación por defecto.
- Recompensas: el canje resta puntos y registra movimiento; el descuento físico se gestiona manualmente en el local.
- Productos: nunca se borra uno con pedidos (FK de order_items); desactivar con is_available=false es la vía normal. DELETE devuelve 409 si hay pedidos.
- Un admin no puede cambiar su propio rol ni desactivarse. No hay borrado de usuarios.
- Regla de datos Pokémon/lugar: cada producto tiene O BIEN inspiration_pokemon_name/pokedex_text/story (Pokémon: panel lateral con aviso legal "proyecto de fans, no afiliado a Nintendo/Game Freak/The Pokémon Company") O BIEN location_name/location_description (lugar de Sinnoh: texto en línea, sin panel ni aviso). Nunca ambos. La BD no lo impone; lo valida services/products.py.
- Imágenes: marcadores neutros; el usuario generará las ilustraciones finales (campo image_url).
- CRM y marketing digital: FASE 2 futura separada. NO implementar nada ni hacer cambios preventivos de arquitectura sin consultar. Si algo pudiera dificultar seriamente un CRM futuro, señalarlo sin actuar.

## Diseño (vigente)

Paleta: cream #F1E9DA (fondo), paper #FAF6ED, espresso #33261C (texto), bark #6E4B34, pine #2E4235 (primario), slate #54687A, ember #A8522E (muy poco uso); modo oscuro marrón casi negro #211812. Fraunces (títulos) + Work Sans (UI). Sin píldoras ni sombras: bordes finos, esquinas rectas. Un solo elemento de atrevimiento por pantalla (hero con MountainScene SVG). Respetar prefers-reduced-motion. Evitar el look genérico de web generada por IA.

## Estado actual

FASE 12 (panel de administración) COMPLETA. Panel con 7 apartados: Dashboard, Pedidos, Productos (CRUD), Reseñas (moderación), Candidaturas, Mensajes, Usuarios.

Subida de CV COMPLETA (commits 29dc50d backend, be504c2 frontend). Testing COMPLETO (backend a8eb922 + a676b0f, frontend cd0f143 + b89f34a). Seguridad y optimización COMPLETO (958cd82, 8b41b4d, d16e8dc, 8fbfe5e). Límite de intentos de login COMPLETO. Docker completo HECHO (ca4e3fa, ab351f8, 248b2cd; pendiente de la prueba del usuario en el navegador en :8080). Para el último commit, consultar `git log`.

Docker (detalle en docs/development.md): perfil `app` en docker-compose.yml (sin perfil solo arranca `db`, como antes). Backend: python:3.14-slim, usuario sin root, aplica `alembic upgrade head` al arrancar, uvicorn con `--proxy-headers --forwarded-allow-ips='*'` (seguro SOLO porque el backend no publica puertos), usa `backend/.env` con DATABASE_URL sustituida por el servicio `db`, monta `./backend/uploads`. Frontend: build con node:24-alpine y nginx:1.30-alpine; nginx en :8080 sirve la SPA (fallback a index.html) y reenvía `/api` al backend con `resolver 127.0.0.11` (resolución por petición), `client_max_body_size 6m` (CVs), caché larga solo en `/assets` y cabeceras de seguridad básicas. En nginx, un `add_header` dentro de un `location` anula los del `server`: por eso la caché se pone con `expires`. CSP pendiente para el deployment (Google Fonts + script en línea del tema en index.html).

Repositorio en GitHub, PRIVADO: https://github.com/Vicram4/cafe-sinnoh (remoto `origin`, rama `main`). Push al final de cada bloque, siempre con OK del usuario. Las credenciales están guardadas en Windows (Git Credential Manager), así que Claude puede hacer el push. El historial se revisó antes del primer push: sin `.env`, secretos ni CVs.

Límite de intentos de login (services/login_attempts.py, tabla `login_attempts`, migración 7b776c013cf5): se comprueba ANTES de verificar la contraseña. Dos límites en ventana deslizante de 15 min: 5 fallos por cuenta+IP y 20 por IP (configurables en config.py). No se limita solo por cuenta, porque cualquiera podría bloquear una cuenta ajena. Responde 429 con `Retry-After`. Un login correcto borra los fallos de esa cuenta+IP. Se guarda un HMAC del email (con SECRET_KEY), nunca el email en claro, y las filas de más de 15 min se borran en cada fallo. Detrás de un proxy (Docker/producción), uvicorn necesita `--proxy-headers` y `--forwarded-allow-ips` para ver la IP real; sin eso, todos los clientes compartirían la IP del proxy y el límite por IP los bloquearía a la vez.

Seguridad y optimización:
- `SECRET_KEY`: config.py rechaza claves de <32 bytes en TODOS los entornos (la app no arranca); `.env.example` la deja vacía con el comando para generarla. `hide_input_in_errors=True` en Settings para que los errores de validación no impriman secretos.
- Dependencias: `pip-audit` en requirements-dev.txt (`pip-audit -r requirements.txt -r requirements-dev.txt`), `npm audit` en 0. requirements.txt ya está en UTF-8.
- Carrito por usuario (CartContext.tsx; claves en cart-context.ts): `cafe-sinnoh:cart:user:<id>` y `cafe-sinnoh:cart:guest`. Al iniciar sesión se incorpora el carrito sin sesión quedándose con la cantidad MAYOR por producto (no la suma, porque F5 cierra sesión y se suele volver a añadir lo mismo). Tras F5 el carrito aparece vacío hasta volver a entrar: es lo esperado.
- Code splitting: router.tsx carga todas las páginas con `lazy` salvo Home y PublicLayout. Una ruta sin path intermedia aporta `hydrateFallbackElement` (sin él, React Router pinta la página en blanco en la primera carga) y `errorElement` (RouteErrorPage, dentro del layout). PublicLayout muestra una línea fija bajo la cabecera mientras carga una página. JS inicial: 265 KB (82 KB gzip).

Tests: backend 93 (`pytest` desde `backend/` con `.venv` activo; solo necesita Docker, no uvicorn), frontend 24 (`npm test` desde `frontend/`). Los tests de backend usan la BD `cafe_sinnoh_test` (TEST_DATABASE_URL en `.env`): conftest.py sustituye DATABASE_URL antes de importar la app, se niega a arrancar si el nombre no termina en `_test`, crea la BD si falta, aplica las migraciones reales y vacía las tablas (TRUNCATE) tras cada test. Los CVs de los tests van a una carpeta temporal. Antes de commitear cambios de backend o frontend, ejecutar también sus tests.

Endpoints añadidos en la FASE 12: POST/PATCH /products, DELETE /products/{id}; GET /reviews/admin/all; PATCH /careers/applications/{id}/status; PATCH /contact/{id}; GET /admin/users; PATCH /admin/users/{id}; GET /orders/admin/all.

Subida de CV: POST /careers/applications es multipart/form-data (CV opcional; 415 si no es PDF, 413 si supera 5 MB, 400 si está vacío); GET /careers/applications/{id}/cv solo admin. Almacenamiento en `backend/uploads/cvs/` (ignorado) vía `app/services/storage.py`. JobApplicationRead expone `has_cv` y `cv_original_name`, nunca `cv_storage_key`. client.ts admite FormData y tiene `api.getBlob`. En FastAPI 0.141 un modelo Form() no se reparte en campos si hay también un archivo: por eso los campos se leen uno a uno en `_application_form` (la documentación web describe una versión más nueva).

Datos de prueba: usuarios test@cafesinnoh.com (ADMIN) y maria@cafesinnoh.com (USER); 12 productos y 3 recompensas sembrados. No guardar contraseñas en este archivo.

## Siguiente trabajo (en este orden)

1. GitHub: README profesional, capturas, CI (pytest con PostgreSQL de servicio, Vitest, build, lint, pip-audit, npm audit y build de las imágenes Docker). En CI hay que definir SECRET_KEY (≥32 bytes) y TEST_DATABASE_URL.
2. Deployment (decidir sesión JWT definitiva; almacenamiento de CVs en S3 u otro, cambiando solo storage.py; SECRET_KEY propia de producción; CSP; revisar si las migraciones se siguen aplicando al arrancar el contenedor o en un paso aparte).
3. Revisión final del portfolio.

## Pendientes y deudas conocidas (no corregir ahora salvo petición)

- El carrito sigue en localStorage (uno por cuenta): no se comparte entre dispositivos. Un carrito en servidor se descartó por coste/beneficio.
- La ruta /about sigue siendo PlaceholderPage.
- Incidencia sin explicar: una vez apareció `QueuePool limit of size 5 overflow 10 reached`. get_db cierra bien la sesión. Si vuelve, ANTES de reiniciar uvicorn ejecutar `select state, count(*) from pg_stat_activity where datname = current_database() group by state;` y guardar el resultado.
- docs/development.md recoge estos pendientes; mantenerlo actualizado.

## Errores ya resueltos (no repetir diagnósticos)

- npm bloqueado en PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (ya aplicado).
- `No module named 'app'`: terminal en carpeta equivocada.
- Paquetes no encontrados: `.venv` sin activar.
- `relation "X" does not exist`: migración generada pero no aplicada.
- oxlint "Fast Refresh only works when file only exports components": usar el patrón de 3 archivos.
- `<a>` dentro de `<button>`: usar ButtonLink.
- Formulario "colgado": backend o Docker parados.
- Conexiones a la BD lentas (>8 s): `DATABASE_URL` con `localhost` en Windows. Ya se usa `127.0.0.1` en `.env` y `.env.example`; tras cambiar `.env` hay que reiniciar uvicorn.