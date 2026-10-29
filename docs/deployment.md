# Publicación (demo de portfolio)

La demo pública se compone de tres servicios gratuitos:

```
Navegador ──> Vercel (web React + reenvío de /api) ──> Northflank (backend, Docker) ──> Neon (PostgreSQL)
```

- **Vercel**: sirve la web compilada (`frontend/`) y reenvía `/api/*` al
  backend. Web y API comparten origen, como con nginx en Docker: la cookie de
  sesión (`SameSite=Strict`) funciona y no hace falta CORS.
- **Northflank** (plan Sandbox, `nf-compute-10`, Europe - West): construye
  `backend/Dockerfile` en cada push a `main` y lo publica. El contenedor aplica
  las migraciones al arrancar. Siempre encendido (no se duerme).
- **Neon** (plan Free, Frankfurt): PostgreSQL 17. Conexión directa, sin el
  *pooler* (las migraciones lo necesitan). Se suspende tras 5 min sin uso;
  `pool_pre_ping` evita errores al despertar. Los CVs van en la BD (tabla
  `stored_files`), porque los alojamientos gratuitos no conservan archivos.

Koyeb y Render se descartaron: Koyeb ya no tiene plan gratuito para cuentas
nuevas (2026) y el de Render se duerme y tarda ~1 minuto en despertar.

## Variables

Los valores secretos nunca van al repositorio.

**Northflank** (Runtime variables del servicio `cafe-sinnoh-api`):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La de Neon, con el prefijo `postgresql+psycopg://` |
| `SECRET_KEY` | Propia de producción (`secrets.token_urlsafe(64)`) |
| `PROXY_SECRET` | Otra clave aleatoria; la misma que en Vercel |
| `ENVIRONMENT` | `production` |
| `DEMO_MODE` | `true` |
| `REFRESH_COOKIE_SECURE` | `true` |

Health check: Readiness, HTTP, puerto 8000, `/health`.

**Vercel** (proyecto con Root Directory `frontend`):

| Variable | Valor |
|---|---|
| `PROXY_SECRET` | La misma que en Northflank |
| `VITE_DEMO_MODE` | `true` |

**GitHub** (Settings → Secrets and variables → Actions):

| Secreto | Valor |
|---|---|
| `DEMO_DATABASE_URL` | La misma `DATABASE_URL` de Northflank |

## Cabecera secreta del proxy

El backend tiene URL pública propia en Northflank, pero responde 403 a todo
(salvo `/health`) si no llega la cabecera `X-Proxy-Secret` correcta. Vercel la
añade en `frontend/vercel.json` con el valor de su variable `PROXY_SECRET`.
Si falta esa variable, Vercel envía el texto literal `$PROXY_SECRET` y el
backend rechaza las peticiones (falla de forma segura).

Así es seguro que uvicorn confíe en `X-Forwarded-For`
(`--forwarded-allow-ips='*'` toma la primera IP): Vercel la sobrescribe con
la IP del visitante y Northflank añade la suya al final.

## Cabeceras y CSP

`frontend/vercel.json` pone la CSP y las cabeceras de seguridad, las mismas
que `frontend/nginx.conf` en Docker (un test comprueba que la CSP coincide y
que incluye el hash del script en línea del tema de `index.html`). Sin
`'unsafe-inline'` ni `eval`: zod se configura con `jitless` en `main.tsx`.
Comprobado en Edge contra Docker: ninguna violación en las páginas públicas,
la cuenta y el panel de administración.

## Reinicio diario de la demo

`.github/workflows/reset-demo.yml` ejecuta `python -m app.seed.reset_demo`
contra Neon cada día a las 04:00 UTC (y a mano con "Run workflow", que
también sirve para cargar la demo la primera vez). Borra todos los datos y
vuelve a sembrar productos, recompensas y las cuentas de demo.

## Costes

Todo en planes gratuitos. Northflank pide una tarjeta para verificar la
cuenta y no tiene un tope de gasto que pare el servicio: hay un aviso de
gasto por email (Billing). No cambiar el plan de recursos ni añadir servicios
sin revisarlo.

## Pendiente

- Comprobar en la web publicada que la cookie de sesión atraviesa el reenvío
  de Vercel (F5 conserva la sesión).
- `og:image` y `og:url` con la URL absoluta y vista previa en LinkedIn.
- Dominio propio (opcional).
- Copias de seguridad: no hay datos reales que perder (la demo se regenera
  cada día). Si algún día los hubiera, revisar las opciones de Neon.
