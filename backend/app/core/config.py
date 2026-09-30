from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación, leída desde variables de entorno
    (o desde el archivo .env en desarrollo). Tener esto tipado evita
    errores tontos como una variable mal escrita que en tiempo de
    ejecución simplemente devolvería None sin avisar."""

    environment: str = "development"
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: str = "http://localhost:5173"

    # Horario del local (hora local, formato 24h) y minutos mínimos de
    # margen entre el momento del pedido y la hora de recogida elegida,
    # para dar tiempo a prepararlo. Simplificado a un único horario
    # diario, sin distinguir fin de semana todavía (el briefing definía
    # horarios distintos para sábado y domingo; lo añadiremos si hace
    # falta más adelante, sin romper nada de lo ya construido).
    shop_opening_hour: int = 8
    shop_closing_hour: int = 20
    min_pickup_lead_minutes: int = 15

    # env_file le dice a pydantic-settings dónde buscar el .env;
    # case_sensitive=False permite que DATABASE_URL (mayúsculas, como
    # es habitual en variables de entorno) coincida con database_url.
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte 'http://a,http://b' en ['http://a', 'http://b']."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Crea Settings() una sola vez y reutiliza siempre la misma
    instancia (evita releer el archivo .env en cada petición)."""
    return Settings()