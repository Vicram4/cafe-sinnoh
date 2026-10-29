# Guía de desarrollo

## Requisitos

Git, Node.js 22.22+ o 24.15+ (lo exigen Vitest 5 y jsdom 30), Python 3.14, Docker Desktop.

## Base de datos local

1. Copiar `.env.example` a `.env` y elegir una contraseña.
2. Iniciar: `docker compose up -d`
3. Comprobar: `docker compose ps` (debe aparecer `healthy`).
4. Parar: `docker compose down` (los datos se conservan).
   Borrar también los datos: `docker compose down -v`.

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
  sin sesión quedándose con la cantidad mayor de cada producto: como F5
  cierra la sesión, es habitual volver a añadir lo mismo, y sumar lo
  duplicaría. Tras F5 el carrito aparece vacío hasta volver a entrar.
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
- `/about` sigue siendo `PlaceholderPage`.