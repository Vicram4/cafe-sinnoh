# Café Sinnoh

[![CI](https://github.com/Vicram4/cafe-sinnoh/actions/workflows/ci.yml/badge.svg)](https://github.com/Vicram4/cafe-sinnoh/actions/workflows/ci.yml)

**Español** · [English](README.en.md)

Aplicación web full-stack para una cafetería artesanal ficticia: carta, pedidos online para recoger en el local, programa de puntos con recompensas, reseñas, empleo con subida de CV y un panel de administración completo.

La marca se inspira en un lugar, la región de Sinnoh: montañas, bosques y frío. Algunos productos rinden homenaje a un Pokémon, siempre con un aviso legal. Las ilustraciones muestran solo el producto, nunca personajes.

> Proyecto de portfolio. Es un proyecto de fans sin ánimo de lucro y no está afiliado a Nintendo, Game Freak ni The Pokémon Company. No usa ningún recurso gráfico oficial.

## Demo

**[cafe-sinnoh.vercel.app](https://cafe-sinnoh.vercel.app)**

En la página de inicio de sesión, los botones **Entrar como cliente** y **Entrar como admin** abren las cuentas de prueba sin escribir nada. Los datos se reinician cada día: puedes hacer pedidos, moderar reseñas o cambiar productos sin miedo a romper nada.

| | |
|---|---|
| ![Portada en modo claro](docs/screenshots/home.webp) | ![Portada en modo oscuro](docs/screenshots/home-oscuro.webp) |
| ![Carta con búsqueda, categorías y orden](docs/screenshots/carta.webp) | ![Ficha de producto](docs/screenshots/producto.webp) |
| ![Dashboard del panel de administración](docs/screenshots/admin.webp) | <img src="docs/screenshots/movil-carta.webp" alt="Carta en el móvil" width="240"> |

Las ilustraciones (productos y montañas de la portada) se generaron con IA a partir de prompts propios y se retocaron después; muestran solo productos y paisajes. Proceso en [docs/ilustraciones-productos.md](docs/ilustraciones-productos.md).

## Funcionalidades

**Clientes**
- Carta con búsqueda, filtro por categoría y orden; ficha de cada producto con su inspiración.
- Carrito y pedido para recoger, con validación de horario y antelación mínima.
- Cuenta personal: datos, historial de pedidos, puntos y canje de recompensas.
- Reseñas solo de productos comprados y recogidos, moderadas antes de publicarse.
- Trabaja con nosotros (candidatura con CV en PDF) y formulario de contacto.
- Modo demo: cuentas de prueba de cliente y de admin con un clic, y reinicio diario de los datos.
- Modo claro y oscuro, diseño adaptable y respeto a `prefers-reduced-motion`.

**Administración**
- Panel con estadísticas, pedidos (máquina de estados), productos (CRUD), moderación de reseñas, candidaturas con descarga de CV, mensajes y usuarios (roles y desactivación).

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, react-hook-form + Zod |
| Backend | Python 3.14, FastAPI, SQLAlchemy 2 (síncrono), Alembic, Pydantic, PyJWT, pwdlib (Argon2) |
| Base de datos | PostgreSQL 17 |
| Infraestructura | Docker, Docker Compose, nginx, GitHub Actions; publicado en Vercel, Northflank y Neon |
| Calidad y seguridad | pytest, Vitest, Testing Library, Oxlint, pip-audit, npm audit, CodeQL, Dependabot |

## Arquitectura

En producción (planes gratuitos):

```mermaid
flowchart LR
    U[Navegador] --> V["Vercel<br/>web React compilada"]
    V -->|"/api + cabecera secreta"| B["Northflank<br/>FastAPI en Docker"]
    B --> D[("Neon<br/>PostgreSQL 17<br/>(datos y CVs)")]
```

En local, la misma imagen del backend detrás de nginx (`docker compose --profile app up`). Los detalles de la publicación están en [docs/deployment.md](docs/deployment.md).

- **Monorepo:** `backend/` y `frontend/` en el mismo repositorio, con entornos y dependencias separados. Interfaz en español; código, tablas y API en inglés.
- **Backend por capas:** `api` (rutas HTTP), `services` (lógica de negocio, sin HTTP), `models` (SQLAlchemy), `schemas` (Pydantic; nunca exponen datos internos como el hash de la contraseña).
- **El backend es la fuente de verdad:** precios, disponibilidad, roles, estados y puntos se calculan y validan siempre en el servidor. El cliente nunca envía un precio.
- **Mismo origen:** Vercel (o nginx en local) sirve la web y reenvía `/api` al backend, así que no hace falta CORS y la cookie de sesión puede ser `SameSite=Strict`.

## Decisiones técnicas destacadas

**Seguridad**
- Sesión en dos piezas: un JWT de corta duración solo en memoria (nunca en `localStorage`) y un token de renovación en una cookie `HttpOnly` + `SameSite=Strict` que JavaScript no puede leer. Un XSS no puede robar la sesión, y aun así se conserva al recargar la página.
- Los tokens de renovación rotan en cada uso: si reaparece uno ya usado (señal de copia), se revoca toda la sesión. En la base de datos solo se guarda su hash, y cerrar sesión la revoca también en el servidor.
- Cada petición consulta el usuario en la BD: un cambio de rol o una desactivación surten efecto al instante, aunque el token siga siendo válido.
- Límite de intentos de login por cuenta + IP y por IP, comprobado antes que la contraseña. Se guarda un HMAC del email, nunca el email en claro.
- Contraseñas de 8 caracteres como mínimo, rechazando las más comunes y las que contienen el propio email (en lugar de reglas de mayúsculas y símbolos, según las recomendaciones del NIST).
- Formularios públicos (registro, contacto y empleo) protegidos contra spam con un límite de envíos por IP y un campo trampa invisible, sin captcha.
- La app no arranca con una `SECRET_KEY` de menos de 32 bytes, y los errores de configuración no muestran secretos.
- CVs validados por extensión, tipo MIME y firma `%PDF-`; se guardan en la base de datos con una clave aleatoria y solo los descarga un admin.
- Content-Security-Policy estricta, sin `'unsafe-inline'` ni `eval`: el único script en línea (el del tema, para que no parpadee al cargar) se autoriza por su hash, y un test comprueba que el hash sigue siendo el correcto.
- El backend publicado solo responde a las peticiones que llegan a través de Vercel (cabecera secreta). Así nadie puede llamarlo directamente con una IP inventada para saltarse los límites por IP.

**Datos**
- Dinero siempre en céntimos (enteros).
- Los pedidos guardan una copia del nombre y el precio de cada producto: el historial no cambia aunque cambie la carta.
- Los puntos son un libro de movimientos: el saldo es una suma, nunca una columna que pueda desincronizarse. Los puntos de un pedido no pueden otorgarse dos veces.

**Frontend**
- Code splitting por rutas: el JavaScript inicial pesa unos 113 KB comprimido. El panel de admin y los formularios (con su validación) solo los descarga quien entra en ellos.
- Un carrito por cuenta en el mismo navegador, que se une al iniciar sesión sin duplicar cantidades.

## Puesta en marcha con Docker

Requisitos: Git y Docker Desktop.

1. Copia las plantillas de configuración:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
2. En `.env`, elige una contraseña para PostgreSQL (sin `@ : / % #`). En `backend/.env`, usa la misma en `DATABASE_URL` y `TEST_DATABASE_URL`, y genera una `SECRET_KEY` (sin instalar Python, con Docker):
   ```bash
   docker run --rm python:3.14-slim python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
3. Arranca todo:
   ```bash
   docker compose --profile app up -d --build
   ```
4. Carga la carta y las recompensas de ejemplo:
   ```bash
   docker compose exec backend python -m app.seed.seed_products
   docker compose exec backend python -m app.seed.seed_rewards
   ```
5. Abre **http://localhost:8080** y regístrate. Para convertir tu cuenta en administradora (usa el usuario y la base de datos de tu `.env`):
   ```bash
   docker compose exec db psql -U sinnoh -d cafe_sinnoh -c "update users set role='ADMIN' where email='tu@email.com';"
   ```

Las migraciones de la base de datos se aplican solas al arrancar el backend.

**Modo demo (opcional).** Para la versión pública: pon `VITE_DEMO_MODE=true` en `.env` y `DEMO_MODE=true` en `backend/.env`, vuelve a construir y crea las cuentas de prueba con `docker compose exec backend python -m app.seed.seed_demo`. El login mostrará los botones "Entrar como cliente" y "Entrar como admin". `python -m app.seed.reset_demo` devuelve la demo a su estado inicial; borra todos los datos, por eso solo funciona con `DEMO_MODE=true`.

## Desarrollo y tests

La guía completa está en [docs/development.md](docs/development.md): desarrollo sin Docker, base de datos de test y auditorías.

| | Comando | Qué cubre |
|---|---|---|
| Backend | `pytest` (en `backend/`) | 130 tests: autenticación, modo demo, sesión persistente, contraseñas, anti-spam, pedidos, puntos, permisos de admin, CVs y límite de login, contra un PostgreSQL de test |
| Frontend | `npm test` (en `frontend/`) | 46 tests: CSP, títulos de página, acceso de demo, sesión y renovación del token, cliente de la API, carrito por usuario, formulario de empleo, tema y formatos |

La CI de GitHub Actions ejecuta en cada push, y cada lunes aunque no haya cambios, los tests, el lint, el build, las auditorías de dependencias y la construcción de las imágenes Docker. Northflank y Vercel publican solos cada cambio en `main`.

**Cuidado del repositorio:**
- CodeQL analiza el código Python, TypeScript y los flujos de GitHub Actions en busca de vulnerabilidades.
- Secret scanning con push protection: GitHub bloquea cualquier push que incluya una clave por error.
- Dependabot propone cada semana las actualizaciones de dependencias. Cada una se prueba antes de aplicarla, y los saltos de versión mayor se revisan a mano (por ejemplo, los tipos de Node siguen la versión de Node que se usa).
- La rama `main` no se puede borrar ni reescribir (*force push*).
- Antes de hacer público el repositorio se revisó el historial completo: ningún `.env`, clave, CV ni dato personal se ha subido nunca.
- El reinicio diario de la demo también es un flujo de GitHub Actions, que usa la URL de la base de datos guardada como secreto del repositorio.

## Estructura

```
backend/
  app/
    api/v1/      Rutas HTTP y dependencias de autenticación
    services/    Lógica de negocio (pedidos, puntos, reseñas, CVs, login...)
    models/      Modelos SQLAlchemy
    schemas/     Esquemas Pydantic
    seed/        Datos de ejemplo (idempotentes)
  alembic/       Migraciones
  tests/
frontend/
  src/
    pages/ layouts/ components/
    context/ hooks/     Estado global (sesión, carrito, tema)
    services/api/       Cliente HTTP centralizado
docs/            Guías de desarrollo y de publicación, capturas y estado del proyecto
```

## Próximos pasos

- Inicio de sesión con Google (opcional).
- Dominio propio.

## Licencia

Sin licencia de código abierto: todos los derechos reservados. El código está publicado para que se pueda leer y evaluar, pero no se concede permiso para copiarlo, modificarlo ni redistribuirlo. Esto incluye la marca Café Sinnoh y las ilustraciones. Pokémon y los nombres relacionados son marcas de sus respectivos propietarios.

## Autor

Desarrollado por [Vicram4](https://github.com/Vicram4), con [Claude Code](https://claude.com/claude-code) como asistente de programación. Yo he dirigido el proyecto: la idea y la marca, las decisiones de producto, diseño y tecnologías, las ilustraciones, y la revisión y prueba de cada bloque antes de darlo por terminado.

Contacto: [victorramos.devs@gmail.com](mailto:victorramos.devs@gmail.com)
