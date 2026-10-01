from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.orders import router as orders_router
from app.api.v1.points import router as points_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.rewards import router as rewards_router
from app.api.v1.products import router as products_router
from app.core.config import get_settings
from app.db.session import get_db

settings = get_settings()

app = FastAPI(title="Café Sinnoh API", version="0.1.0")

# CORS: sin esto, el navegador bloquearía las peticiones del frontend
# (localhost:5173) a esta API (localhost:8000), porque son "orígenes"
# distintos. Solo permitimos los orígenes indicados en .env, nunca "*"
# en un proyecto con autenticación por cookies/JWT.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(points_router, prefix="/api/v1")
app.include_router(rewards_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    """Ruta de comprobación: confirma que el servidor responde y qué
    entorno tiene cargado (útil para distinguir development/production
    de un vistazo)."""
    return {"status": "ok", "environment": settings.environment}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Ruta temporal: confirma que el backend puede conectar de verdad
    con PostgreSQL. Se retirará cuando existan rutas reales que ya
    ejerciten la base de datos (a partir de la FASE 6)."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}