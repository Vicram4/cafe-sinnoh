# Café Sinnoh: contexto para Claude Code

Aplicación web Full-Stack para una cafetería ficticia, proyecto de portfolio profesional. Marca: cafetería artesanal con identidad propia, inspirada sutilmente en la región de Sinnoh (Pokémon) como lugar (montañas, Monte Corona, bosques, frío). Nunca como fan page. Nunca usar assets oficiales de Pokémon.

El dueño tiene formación DAW y Marketing, y lleva ~1 año sin desarrollar de forma habitual. Quiere aprender tecnologías actuales y poder explicar el proyecto en entrevistas.

## Reglas de trabajo (respetar siempre)

- Responder y explicar SIEMPRE en español.
- Trabajo incremental: bloques sustanciales pero verificables (backend primero, probar en /docs, luego frontend, probar en navegador). Nunca generar el proyecto entero de golpe.
- Commits pequeños, separados backend/frontend, con prefijos feat:/fix:/docs:/chore:/test:/refactor:.
- ANTES de cada commit: mostrar `git status` y esperar confirmación del usuario. Antes de commitear frontend: `npm run build` y `npm run lint` limpios (desde la carpeta frontend). El único aviso aceptado es el de bundle >500 KB (pendiente conocido).
- Comprobar siempre que `.venv`, `.env` y `node_modules` NUNCA se suban.
- Comentarios de código solo cuando expliquen lógica, arquitectura o seguridad importantes. Nunca comentarios obvios.
- Verificar la documentación actual de una librería antes de usarla; no fiarse de memoria desactualizada.
- Revisar el contenido de las migraciones de Alembic antes de aplicarlas. Generar Y aplicar la migración en el mismo paso, nunca solo una. No generar una nueva si la BD no está al día (`alembic upgrade head` primero).
- No inventar información. Si algo es incierto, decirlo como "no confirmado".
- NO rehacer lo ya construido ni proponer alternativas a las decisiones de abajo sin que el usuario lo pida.
- Al modificar un archivo existente, dar cambios completos y precisos; ojo con archivos parecidos (error ya ocurrido: se editó AccountLayout.tsx en vez de AdminLayout.tsx).
- Si el usuario pega salidas de terminal en orden raro, comprobarlo antes de asumir un fallo.

## Stack real (no sustituir)

Frontend (carpeta `frontend/`): React + TypeScript + Vite; Tailwind CSS v4 (CSS-first con @theme, sin tailwind.config.js; dark mode manual vía @custom-variant); React Router v8 (`react-router`, createBrowserRouter); TanStack React Query; react-hook-form + zod + @hookform/resolvers/zod; Oxlint (NO ESLint); fuentes Fraunces + Work Sans.

Backend (carpeta `backend/`, entorno `.venv` propio): Python 3.14; FastAPI + Uvicorn; pydantic-settings; SQLAlchemy 2.x SÍNCRONO (no async) + psycopg3 (`psycopg[binary]`, no psycopg2); Alembic; pwdlib[argon2] (NO passlib); PyJWT (NO python-jose); python-multipart; email-validator.

BD: PostgreSQL 17 (postgres:17-alpine) en Docker Compose (solo servicio db, contenedor `cafe-sinnoh-db`, puerto 5432 solo en 127.0.0.1).

NO se usa: passlib, python-jose, psycopg2, SQLAlchemy async, librerías de animación, librerías de calendario, Radix ni otra librería de diálogos (SidePanel hecho a mano).

Testing: NO instalado todavía (pytest y Vitest pendientes).

## Entorno del usuario

Windows + PowerShell 5.1, monorepo en `C:\dev\cafe-sinnoh`. Los caracteres raros (Ã³) al leer archivos con Get-Content son solo codificación de PowerShell; los archivos deben guardarse en UTF-8. Los avisos "CRLF will be replaced by LF" son cosméticos. Comandos de npm siempre desde `frontend/`; uvicorn, alembic y pip desde `backend/` con `.venv` activo (`.\.venv\Scripts\Activate.ps1`). Antes de probar: Docker (PostgreSQL), uvicorn (`uvicorn app.main:app --reload`) y `npm run dev` deben estar en marcha.

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

FASE 12 (panel de administración) COMPLETA. Último commit conocido: 1ccf139. Panel con 7 apartados: Dashboard, Pedidos, Productos (CRUD), Reseñas (moderación), Candidaturas, Mensajes, Usuarios.

Endpoints añadidos en la FASE 12: POST/PATCH /products, DELETE /products/{id}; GET /reviews/admin/all; PATCH /careers/applications/{id}/status; PATCH /contact/{id}; GET /admin/users; PATCH /admin/users/{id}; GET /orders/admin/all.

Datos de prueba: usuarios test@cafesinnoh.com (ADMIN) y maria@cafesinnoh.com (USER); 12 productos y 3 recompensas sembrados. No guardar contraseñas en este archivo.

## Siguiente trabajo (en este orden)

1. **Subida de CV en candidaturas** (decisiones cerradas):
   - Solo PDF, validado por extensión, content-type Y firma `%PDF-` del contenido.
   - Máximo 5 MB.
   - Opcional pero recomendado: la candidatura se crea sin CV; el formulario muestra ayuda ("Recomendado: adjunta tu CV en PDF, máx. 5 MB") sin bloquear.
   - Almacenamiento en disco local, aislado en `backend/app/services/storage.py` para poder cambiarlo por S3 en el deployment.
   - El archivo se guarda con nombre generado; el original solo se conserva en `cv_original_name`. La carpeta de almacenamiento debe estar en .gitignore.
   - Sin migración: `cv_storage_key` y `cv_original_name` ya existen en JobApplication.
   - POST /careers/applications pasa a multipart/form-data. Descarga solo para admin; en el frontend se pide con fetch + token y se genera un enlace temporal (el token vive en memoria). Botón "Descargar CV" solo si hay archivo.
   - client.ts fuerza Content-Type JSON: debe admitir FormData sin romper el resto.
2. Testing: pytest (backend) y Vitest (frontend); cubrir auth, pedidos, puntos y permisos de admin. Decidir BD de test separada (verificar versiones compatibles con Python 3.14, SQLAlchemy 2.x y Vite antes de instalar).
3. Seguridad y optimización: carrito por usuario, code splitting, SECRET_KEY fuerte.
4. Docker completo (front + back).
5. GitHub: README profesional, capturas, CI.
6. Deployment (decidir sesión JWT definitiva).
7. Revisión final del portfolio.

## Pendientes y deudas conocidas (no corregir ahora salvo petición)

- Carrito en localStorage sin vincular a usuario (compartido entre cuentas en el mismo navegador).
- Bundle de producción >500 KB (~547 KB): falta code splitting por rutas.
- SECRET_KEY de desarrollo ("dev-secret-change-me") demasiado corta para HS256: cambiar antes de producción.
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