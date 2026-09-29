from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# pool_pre_ping evita errores si la conexión ha caducado (por ejemplo,
# tras reiniciar el contenedor de PostgreSQL) comprobándola antes de
# usarla, en vez de fallar a mitad de una petición.
engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: crea una sesión de base de datos por
    petición HTTP y la cierra siempre al terminar (incluso si la ruta
    lanza un error), gracias al try/finally. Cada router la recibirá
    como parámetro con Depends(get_db)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()