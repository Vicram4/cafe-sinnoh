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
- Los avisos `InsecureKeyLengthWarning` son la `SECRET_KEY` corta de
  desarrollo (pendiente conocido).

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


## Pendientes para la revisión final (FASE 19)

- El carrito vive en localStorage sin vincularse a ningún usuario.
  Si dos personas distintas usan el mismo navegador, comparten el
  mismo carrito, incluso cambiando de cuenta. Decisión: revisar si
  vincular el carrito a cada usuario (clave de localStorage por
  email) o mantenerlo como limitación conocida y documentada.
- El build de producción del frontend supera los 500 KB en un único
  archivo JS (aviso de Vite tras añadir React Query/RHF/Zod). No es un
  error: es una optimización pendiente. Revisar code splitting por
  rutas (React.lazy) en la FASE 15, cuando el árbol de páginas esté
  completo y sepamos qué partes pesan más.

  
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
- `backend/requirements.txt` está guardado en UTF-16 (salida de `pip freeze >`
  en PowerShell 5.1). No está confirmado que pip lo lea bien en todos los
  entornos: pasarlo a UTF-8 antes de Docker/CI.

## Pendientes añadidos

- `SECRET_KEY` de desarrollo ("dev-secret-change-me") más corta de lo
  recomendado para HS256: cambiarla antes de producción.- El bundle del frontend ya está en unos 549 KB (code splitting pendiente).