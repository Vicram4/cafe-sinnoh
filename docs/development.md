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