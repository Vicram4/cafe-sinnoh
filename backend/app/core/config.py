from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MIN_SECRET_KEY_BYTES = 32


class Settings(BaseSettings):
    """Configuración de la aplicación, leída desde variables de entorno
    (o desde el archivo .env en desarrollo). Tener esto tipado evita
    errores tontos como una variable mal escrita que en tiempo de
    ejecución simplemente devolvería None sin avisar."""

    environment: str = "development"
    # Solo con DEMO_MODE=true se puede ejecutar el reinicio de la demo
    # (app/seed/reset_demo.py), que BORRA todos los datos.
    demo_mode: bool = False
    database_url: str
    # Solo la usan los tests (tests/conftest.py), que sustituyen con ella
    # DATABASE_URL antes de arrancar la app.
    test_database_url: str | None = None
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # Sesión persistente: cookie HttpOnly con un token de renovación
    # (services/refresh_tokens.py). "Secure" (solo por HTTPS) activado por
    # defecto; en desarrollo sobre http se desactiva desde el .env.
    refresh_token_expire_days: int = 7
    refresh_cookie_secure: bool = True
    cors_origins: str = "http://localhost:5173"

    # Límite de intentos de login fallidos (services/login_attempts.py),
    # contados en una ventana deslizante de N minutos.
    login_max_failures_per_account: int = 5
    login_max_failures_per_ip: int = 20
    login_failure_window_minutes: int = 15
    # Anti-spam de los formularios públicos (registro, contacto, empleo):
    # envíos por IP y por formulario en una ventana de N minutos.
    form_max_submissions: int = 5
    form_window_minutes: int = 60

    # Horario del local (hora local, formato 24h) y minutos mínimos de
    # margen entre el momento del pedido y la hora de recogida elegida,
    # para dar tiempo a prepararlo. Simplificado a un único horario
    # diario, sin distinguir fin de semana todavía (el briefing definía
    # horarios distintos para sábado y domingo; lo añadiremos si hace
    # falta más adelante, sin romper nada de lo ya construido).
    shop_opening_hour: int = 8
    shop_closing_hour: int = 20
    min_pickup_lead_minutes: int = 15

    # Ruta absoluta calculada desde este archivo (backend/uploads), para
    # no depender de la carpeta desde la que se lance uvicorn. Debe
    # coincidir con la entrada del .gitignore.
    upload_dir: Path = Path(__file__).resolve().parents[2] / "uploads"
    cv_max_bytes: int = 5 * 1024 * 1024

    # env_file le dice a pydantic-settings dónde buscar el .env;
    # case_sensitive=False permite que DATABASE_URL (mayúsculas, como
    # es habitual en variables de entorno) coincida con database_url.
    # hide_input_in_errors: sin esto, un error de validación imprime el
    # valor recibido, y acabarían en los logs la SECRET_KEY o la
    # contraseña incluida en DATABASE_URL.
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, hide_input_in_errors=True)

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        """Se exige en todos los entornos, no solo en producción: así es
        imposible desplegar por descuido con una clave débil. 32 bytes es
        el mínimo que recomiendan RFC 7518 y PyJWT para HS256; con menos,
        la firma de los JWT se puede atacar por fuerza bruta."""
        if len(value.encode()) < MIN_SECRET_KEY_BYTES:
            raise ValueError(
                f"SECRET_KEY debe tener al menos {MIN_SECRET_KEY_BYTES} bytes. Genera una con: "
                'python -c "import secrets; print(secrets.token_urlsafe(64))"'
            )
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte 'http://a,http://b' en ['http://a', 'http://b']."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Crea Settings() una sola vez y reutiliza siempre la misma
    instancia (evita releer el archivo .env en cada petición)."""
    return Settings()