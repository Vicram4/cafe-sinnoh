from pwdlib import PasswordHash

# PasswordHash.recommended() usa Argon2 por defecto (el algoritmo
# recomendado actualmente por la documentación de FastAPI). Una única
# instancia reutilizada en toda la app, en vez de crearla en cada
# petición.
password_hash = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)