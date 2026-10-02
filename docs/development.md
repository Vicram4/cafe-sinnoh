# Guía de desarrollo

## Requisitos

Git, Node.js 20.19+, Python 3.11+, Docker Desktop.

## Base de datos local

1. Copiar `.env.example` a `.env` y elegir una contraseña.
2. Iniciar: `docker compose up -d`
3. Comprobar: `docker compose ps` (debe aparecer `healthy`).
4. Parar: `docker compose down` (los datos se conservan).
   Borrar también los datos: `docker compose down -v`.

## Convenciones de commits

`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.


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

## Pendientes añadidos

- `SECRET_KEY` de desarrollo ("dev-secret-change-me") más corta de lo
  recomendado para HS256: cambiarla antes de producción.
- El bundle del frontend ya está en unos 547 KB (code splitting pendiente).