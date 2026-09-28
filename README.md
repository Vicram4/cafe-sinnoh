# Café Sinnoh

Aplicación web full-stack para una cafetería ficticia: menú, pedidos online
para recoger en el local, programa de puntos, reseñas y panel de administración.
Con guiños sutiles a la región de Sinnoh.

> Proyecto de portfolio en desarrollo. Es un proyecto de fans sin ánimo de lucro
> y no está afiliado a Nintendo, Game Freak ni The Pokémon Company.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Base de datos:** PostgreSQL
- **Infraestructura:** Docker, Docker Compose

## Estado

- [x] Fase 1: repositorio y entorno
- [ ] Fase 2: frontend base

## Desarrollo local

Base de datos:

    cp .env.example .env    # en PowerShell: Copy-Item .env.example .env
    docker compose up -d

La documentación detallada irá creciendo en la carpeta `docs/`.