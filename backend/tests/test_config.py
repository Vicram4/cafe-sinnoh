import secrets

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _settings(secret_key: str) -> Settings:
    # _env_file=None: solo cuenta lo que se pasa aquí, no el .env real.
    return Settings(_env_file=None, database_url="postgresql+psycopg://u:p@localhost/db", secret_key=secret_key)


@pytest.mark.parametrize("weak_key", ["", "dev-secret-change-me", "a" * 31])
def test_weak_secret_key_is_rejected(weak_key: str) -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY debe tener al menos 32 bytes"):
        _settings(weak_key)


def test_strong_secret_key_is_accepted() -> None:
    key = secrets.token_urlsafe(64)

    assert _settings(key).secret_key == key
