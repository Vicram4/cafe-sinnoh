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