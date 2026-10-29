FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencias antes que el código: Docker reutiliza esta capa (la más
# lenta) mientras requirements.txt no cambie. requirements-dev.txt no se
# instala: pytest y pip-audit no van en la imagen.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app

# Sin privilegios de root: si alguien explotara la app, no controlaría el
# contenedor. No necesita escribir en disco: los CVs van en la BD.
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# Migraciones pendientes y después la API. --proxy-headers con
# --forwarded-allow-ips='*' hace que uvicorn tome la IP real del cliente de
# la cabecera que envía nginx (necesario para el límite de login). Es seguro
# SOLO porque este contenedor no publica puertos: únicamente nginx, en la
# red interna de Docker, puede hablar con él.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
