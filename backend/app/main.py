from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

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


@app.get("/health")
def health_check():
    """Ruta de comprobación: confirma que el servidor responde y qué
    entorno tiene cargado (útil para distinguir development/production
    de un vistazo)."""
    return {"status": "ok", "environment": settings.environment}