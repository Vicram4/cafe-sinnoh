"""Almacenamiento de archivos subidos (de momento, solo CVs).

Toda la aplicación pasa por estas tres funciones y solo conoce la
"clave" del archivo, nunca su ruta. Así, en el deployment se puede
sustituir el disco local por S3 cambiando únicamente este módulo."""

import re
import uuid
from pathlib import Path

from app.core.config import get_settings

_CV_FOLDER = "cvs"
# La clave se genera aquí y se guarda en BD; aun así se valida antes de
# construir una ruta, para que un valor manipulado no pueda salir de la
# carpeta de subidas (p. ej. "../../.env").
_KEY_PATTERN = re.compile(r"^[0-9a-f]{32}\.pdf$")


def _path_for(key: str) -> Path:
    if not _KEY_PATTERN.fullmatch(key):
        raise ValueError("Clave de almacenamiento no válida.")
    return get_settings().upload_dir / _CV_FOLDER / key


def save_cv(content: bytes) -> str:
    key = f"{uuid.uuid4().hex}.pdf"
    path = _path_for(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return key


def read_cv(key: str) -> bytes | None:
    path = _path_for(key)
    if not path.is_file():
        return None
    return path.read_bytes()


def delete_cv(key: str) -> None:
    _path_for(key).unlink(missing_ok=True)
