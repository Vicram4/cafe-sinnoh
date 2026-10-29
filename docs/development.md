# Guía de desarrollo

## Requisitos

- Solo para ejecutar la app con Docker: Git y Docker Desktop.
- Para desarrollar: además, Node.js 22.22+ o 24.15+ (lo exigen Vitest 5 y
  jsdom 30) y Python 3.14.

## Configuración inicial (una sola vez)

1. Copiar `.env.example` (raíz) a `.env` y elegir una contraseña para
   PostgreSQL. Evitar en ella los caracteres `@ : / % #`: va dentro de una
   URL de conexión y la romperían.
2. Copiar `backend/.env.example` a `backend/.env`: poner la misma contraseña
   en `DATABASE_URL` y `TEST_DATABASE_URL`, y generar una `SECRET_KEY` con
   `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
3. (Solo para desarrollar el frontend) copiar `frontend/.env.example` a
   `frontend/.env`.

## Opción A: toda la app en Docker

```powershell
docker compose --profile app up -d --build
```

- Web en **http://localhost:8080**. nginx sirve el frontend compilado y
  reenvía `/api` al backend: mismo origen, sin CORS.
- El backend aplica las migraciones pendientes al arrancar.
- En una base de datos nueva, cargar los datos iniciales (idempotente):
  ```powershell
  docker compose exec backend python -m app.seed.seed_products
  docker compose exec backend python -m app.seed.seed_rewards
  ```
- Tras cambiar código, volver a ejecutar el mismo comando (`--build`
  reconstruye solo lo que ha cambiado).
- Ver logs: `docker compose logs -f backend` (o `frontend`).
- Parar solo la app y dejar la BD: `docker compose stop backend frontend`.
- Parar todo: `docker compose --profile app down` (los datos se conservan;
  `down -v` los borraría).

Arquitectura y decisiones:
- Solo nginx publica un puerto (`127.0.0.1:8080`). El backend no publica
  ninguno: solo nginx llega a él dentro de la red de Docker. Por eso uvicorn
  puede confiar en la IP del cliente que reenvía nginx (`--proxy-headers
  --forwarded-allow-ips='*'`), que necesita el límite de login.
- nginx resuelve el nombre `backend` en cada petición (`resolver
  127.0.0.11`), no solo al arrancar: así no falla si el backend aún no está
  listo ni se queda con una IP antigua tras reiniciarse.
- `client_max_body_size 6m`: sin esto, nginx rechazaría los CVs de más de
  1 MB.
- Caché: `/assets` (archivos con huella) un año; `index.html` sin caché,
  para que una versión nueva se cargue siempre.
- Cabeceras: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
  La CSP queda para el deployment: hay que permitir Google Fonts y el
  script en línea del modo oscuro de `index.html`.
- La versión Docker comparte con el desarrollo local la base de datos y la
  carpeta `backend/uploads` (CVs), montada en el contenedor. En Linux, el
  contenedor escribe como el usuario 1000: si la carpeta pertenece a otro
  usuario, la subida de CVs fallaría por permisos (en Windows y macOS no
  pasa).
- El backend usa `backend/.env` (SECRET_KEY, etc.); Compose sustituye
  `DATABASE_URL` para apuntar al servicio `db`.
- Ni `.env`, ni `.venv`, ni `node_modules`, ni los tests ni los CVs entran en
  las imágenes (`.dockerignore`).

## Opción B: desarrollo local

1. Solo la base de datos: `docker compose up -d`
   (comprobar con `docker compose ps` que aparece `healthy`).
2. Backend: `cd backend`, `.\.venv\Scripts\Activate.ps1`,
   `uvicorn app.main:app --reload` → http://127.0.0.1:8000/docs
3. Frontend: `cd frontend`, `npm run dev` → http://localhost:5173
   (Vite reenvía `/api` a uvicorn en el puerto 8000: tiene que estar en marcha)
4. Parar la BD: `docker compose down` (los datos se conservan).
   Borrar también los datos: `docker compose down -v`.

Las opciones A y B pueden funcionar a la vez.

## Convenciones de commits

`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.

## Tests

### Backend (pytest)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt   # solo la primera vez
pytest
```

- Solo necesita Docker (PostgreSQL) en marcha; no hace falta uvicorn.
- Usa la BD `cafe_sinnoh_test`, definida en `TEST_DATABASE_URL` (`.env`).
  La primera ejecución la crea y le aplica las migraciones de Alembic.
- `tests/conftest.py` sustituye `DATABASE_URL` por la de test antes de
  importar la app y se niega a arrancar si el nombre no termina en `_test`:
  la BD de desarrollo nunca se toca. Las tablas se vacían tras cada test.
- Los CVs subidos en los tests van a una carpeta temporal.
- Auditoría de dependencias: `pip-audit -r requirements.txt -r requirements-dev.txt`
  (backend) y `npm audit` (frontend).

### Frontend (Vitest)

```powershell
cd frontend
npm test
```

- Vitest 5 + jsdom + Testing Library. Configuración en el bloque `test`
  de `vite.config.ts`; setup en `src/test/setup.ts`.
- `globals` desactivado: cada test importa `describe/it/expect` de
  `vitest`, y el desmontaje de componentes (`cleanup`) se hace en el setup.
- Los tests viven junto al código que prueban (`*.test.ts(x)`).


## Seguridad y optimización

- **`SECRET_KEY`:** obligatoria y de al menos 32 bytes en todos los
  entornos; si no, la app no arranca. Generar una con
  `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
  Los errores de configuración no muestran los valores recibidos
  (`hide_input_in_errors`), para no filtrar secretos en los logs.
- **Carrito por usuario:** una clave de localStorage por cuenta (por id, no
  por email) y otra sin sesión. Al iniciar sesión se incorpora el carrito
  sin sesión quedándose con la cantidad mayor de cada producto: si la sesión
  caduca, es habitual volver a añadir lo mismo antes de entrar, y sumar lo
  duplicaría.
- **Sesión persistente** (`app/services/refresh_tokens.py`, `AuthContext.tsx`):
  - Access token JWT de 30 minutos, solo en memoria. Token de renovación de
    7 días en una cookie `HttpOnly`, `SameSite=Strict` y `Path=/api/v1/auth`:
    JavaScript no puede leerla y el navegador no la envía desde otras webs.
  - `POST /auth/refresh` rota el token en cada uso. Si llega uno ya usado,
    se revoca toda la sesión (alguien tiene una copia). `POST /auth/logout`
    la revoca en el servidor. En la BD solo se guarda el SHA-256 del token.
  - El frontend renueva solo, 60 s antes de que caduque el access token.
    Las renovaciones se hacen de una en una, también entre pestañas (Web
    Locks): dos rotaciones simultáneas parecerían un robo.
  - `REFRESH_COOKIE_SECURE`: `false` sobre http (desarrollo y Docker local)
    y `true` en producción con HTTPS (es el valor por defecto).
  - La cookie exige que web y API compartan origen: en desarrollo, Vite
    reenvía `/api` a uvicorn (`vite.config.ts`), y en Docker lo hace nginx.
  - Para cerrar todas las sesiones en desarrollo:
    `docker exec cafe-sinnoh-db psql -U sinnoh -d cafe_sinnoh -c "delete from refresh_tokens;"`
- **Code splitting:** todas las páginas salvo la Home se cargan con `lazy`
  de React Router. Una ruta sin path intermedia aporta
  `hydrateFallbackElement` (sin él, la primera carga de una página diferida
  se queda en blanco) y `errorElement` (`RouteErrorPage`, con botón de
  recargar). Se requiere react-router ≥ 8.5.1, que reintenta las descargas
  fallidas de páginas diferidas en lugar de recordar el error.
  JS inicial: 265 KB (82 KB gzip), antes 549 KB.
- **Límite de intentos de login** (`app/services/login_attempts.py`):
  - Se comprueba antes de verificar la contraseña: durante un bloqueo, ni
    la contraseña correcta permite entrar.
  - 5 fallos por cuenta+IP o 20 por IP en 15 minutos → 429 con
    `Retry-After`. Valores configurables en `config.py`.
  - No se limita solo por cuenta: si no, cualquiera podría bloquear la
    cuenta de otra persona fallando a propósito.
  - Un login correcto borra los fallos de esa cuenta+IP.
  - Se guarda un HMAC del email, nunca el email en claro. Los registros de
    más de 15 minutos se borran solos en cada fallo.
  - **Detrás de un proxy** (Docker, producción) la IP que llega es la del
    proxy: arrancar uvicorn con `--proxy-headers --forwarded-allow-ips=<IP
    del proxy>`. Sin eso, todos los usuarios compartirían IP y el límite
    por IP los bloquearía a la vez.
  - Para desbloquear una cuenta en desarrollo:
    `docker exec cafe-sinnoh-db psql -U sinnoh -d cafe_sinnoh -c "delete from login_attempts;"`

## Repositorio

- GitHub, privado: `https://github.com/Vicram4/cafe-sinnoh` (remoto `origin`).
- Se sube con `git push` al final de cada bloque de trabajo.
- CI con GitHub Actions (`.github/workflows/ci.yml`), en cada push a `main`
  y en cada pull request. Tres trabajos en paralelo:
  - backend: pytest contra un PostgreSQL 17 de servicio y pip-audit;
  - frontend: lint, tests, build y `npm audit --audit-level=high`;
  - docker: build de las dos imágenes, `nginx -t` y que la app se importe.
  Ver el resultado en la pestaña **Actions** del repositorio.
- README en español (`README.md`) y en inglés (`README.en.md`): al cambiar
  algo que aparezca en uno, actualizar los dos.

- **Contraseñas:** de 8 a 128 caracteres. Se rechazan las más comunes, las
  que repiten siempre los mismos caracteres y las que contienen la parte
  local del email (`app/services/passwords.py`). No se exigen mayúsculas ni
  símbolos (NIST SP 800-63B). Las cuentas ya existentes no se ven afectadas.
- **Anti-spam en formularios públicos** (registro, contacto y empleo):
  - 5 envíos por IP y formulario cada 60 minutos → 429 con `Retry-After`
    (`form_rate_limit` en `deps.py`, tabla `rate_limit_events`).
  - Campo trampa `website` (`HoneypotField.tsx`): fuera de la pantalla, sin
    tabulador y oculto a los lectores de pantalla. Si llega relleno, el
    backend responde 400 con un mensaje genérico.
  - Para limpiar los límites en desarrollo:
    `docker exec cafe-sinnoh-db psql -U sinnoh -d cafe_sinnoh -c "delete from rate_limit_events; delete from login_attempts;"`
- **Dependabot** (`.github/dependabot.yml`): propuestas semanales de
  actualización para pip, npm, GitHub Actions y las imágenes Docker. La CI
  también se ejecuta cada lunes, aunque no haya cambios.

- **Fuentes:** Fraunces y Work Sans se sirven desde la propia web
  (`@fontsource-variable`), no desde Google Fonts.
- **Aviso legal y privacidad** en `/legal`, enlazado desde el pie y los
  formularios. Contacto: victorramos.devs@gmail.com.
- **Modo demo:**
  - Backend: `DEMO_MODE=true` en `backend/.env`.
    `python -m app.seed.seed_demo` crea las cuentas de prueba
    (demo.cliente@example.com / cafe-demo-cliente y
    demo.admin@example.com / cafe-demo-admin) con datos de ejemplo, sin
    borrar nada. `python -m app.seed.reset_demo` BORRA TODO y vuelve a
    sembrar; se niega a ejecutarse sin `DEMO_MODE=true`. En la demo
    publicada se programará una vez al día.
  - Frontend: `VITE_DEMO_MODE=true` (en `frontend/.env` para desarrollo, en
    el `.env` de la raíz para Docker) muestra el aviso de demo, los botones de
    cuentas de prueba en el login y el aviso de no subir CVs reales.

- **SEO (mínimo, a propósito):** la web NO se indexa en Google (etiqueta
  `robots` en `index.html` y cabecera `X-Robots-Tag` en nginx). No bloquear
  además en `robots.txt`: Google no podría leer el `noindex`. Cada página
  pone su título con `usePageTitle`. Las etiquetas Open Graph (vista previa
  al compartir) están en `index.html`; `og:image` y `og:url` se añaden al
  publicar, porque necesitan la URL absoluta del dominio
  (`public/og-image.png`, 1200×630).

## Notas del panel de administración (FASE 12)

- Productos: desactivar (`is_available = false`) es la vía normal para retirar
  un producto. El borrado físico se rechaza con 409 si el producto tiene
  pedidos asociados, para conservar el historial.
- Usuarios: `get_current_user` rechaza cuentas desactivadas en cada petición
  (403), no solo en el login, así que desactivar a alguien corta su acceso
  aunque su token siga siendo válido. Un admin no puede cambiar su propio rol
  ni desactivarse.
- Candidaturas y mensajes de contacto: `PATCH /careers/applications/{id}/status`
  y `PATCH /contact/{id}`. Sin máquina de estados: es seguimiento manual.
- Incidencia no explicada: durante el Bloque 3 apareció una vez
  `QueuePool limit of size 5 overflow 10 reached`. No se reprodujo tras
  reiniciar uvicorn. Si vuelve, antes de reiniciar ejecutar en PostgreSQL:
  `select state, count(*) from pg_stat_activity where datname = current_database() group by state;`
  y guardar el resultado.

## Subida de CV en candidaturas

- `POST /careers/applications` es `multipart/form-data`: campos de texto más
  un archivo `cv` opcional. Solo PDF, validado por extensión, content-type y
  firma `%PDF-` del contenido. Máximo 5 MB (`CV_MAX_BYTES` en config).
  Errores: 415 (no es PDF), 413 (demasiado grande), 400 (vacío).
- Si el CV no es válido no se crea la candidatura. Si falla el guardado en
  BD, se borra el archivo ya escrito.
- El archivo se guarda en `backend/uploads/cvs/` (ignorado por Git) con un
  nombre aleatorio. El nombre original solo se guarda en `cv_original_name`.
  Todo el acceso a disco pasa por `app/services/storage.py`: para usar S3 en
  el deployment, solo cambia ese módulo.
- `GET /careers/applications/{id}/cv`, solo admin. El frontend lo pide con
  fetch + token y lo descarga desde un enlace temporal (`URL.createObjectURL`),
  porque el token vive en memoria y un enlace directo no lo llevaría.
- `client.ts` acepta `FormData` (no fuerza `Content-Type` JSON) y tiene
  `api.getBlob` para descargas.
- FastAPI 0.141 no reparte un modelo `Form()` en campos si el endpoint
  también recibe un archivo (la documentación web describe una versión más
  nueva). Por eso los campos se leen uno a uno en `_application_form` y se
  validan con `JobApplicationCreate`.

## Entorno local en Windows

- `DATABASE_URL` usa `127.0.0.1`, no `localhost`. Con `localhost`, cada
  conexión nueva tardaba más de 8 s: se cree que Windows prueba primero
  IPv6 (`::1`) y el contenedor solo escucha en IPv4 (no confirmado). Podría
  estar relacionado con el "formulario colgado" y con la incidencia del
  QueuePool (no confirmado). Tras cambiar `.env` hay que reiniciar uvicorn.
- No generar `requirements.txt` con `pip freeze > requirements.txt` en
  PowerShell 5.1: lo guarda en UTF-16. Usar
  `pip freeze | Out-File -Encoding ascii requirements.txt` (`utf8` en
  PowerShell 5.1 añade BOM) o editarlo a mano.

## Pendientes

- El carrito sigue en localStorage (uno por cuenta), así que no se comparte
  entre dispositivos.
- Programar el reinicio diario de la demo al publicarla (deployment).