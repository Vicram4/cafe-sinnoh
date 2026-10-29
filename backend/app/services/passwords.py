"""Política de contraseñas al registrarse.

Sigue las recomendaciones actuales (NIST SP 800-63B): se exige longitud
(8+, en el esquema) y se rechazan contraseñas conocidas o fáciles de
adivinar, en vez de imponer mayúsculas o símbolos, que llevan a
contraseñas predecibles como "Password1!"."""

# Las más usadas en filtraciones públicas con 8 caracteres o más (las más
# cortas ya las rechaza la longitud), más algunas habituales en español y
# del propio proyecto. Se comparan en minúsculas.
COMMON_PASSWORDS = frozenset(
    {
        "12345678", "123456789", "1234567890", "0123456789", "87654321", "987654321",
        "11111111", "00000000", "12341234", "12121212", "11223344", "123123123",
        "password", "password1", "password12", "password123", "passw0rd", "p@ssw0rd",
        "qwertyui", "qwertyuiop", "qwerty123", "qwerty12", "1q2w3e4r", "1q2w3e4r5t",
        "1qaz2wsx", "zaq12wsx", "asdfghjk", "asdfghjkl", "zxcvbnm1", "abcd1234",
        "abc12345", "abcdefgh", "iloveyou", "sunshine", "princess", "football",
        "baseball", "superman", "starwars", "whatever", "trustno1", "welcome1",
        "letmein1", "admin123", "administrator", "changeme", "computer", "internet",
        "michelle", "jennifer", "1234qwer", "qwer1234", "q1w2e3r4", "aa123456",
        "contraseña", "contrasena", "contraseña1", "contrasena1", "contraseña123",
        "contrasena123", "teamo123", "tequiero", "barcelona", "realmadrid", "españa",
        "espana123", "123456789a", "cafesinnoh", "cafesinnoh1", "cafesinnoh123", "sinnoh123",
    }
)


class WeakPasswordError(Exception):
    pass


def check_password_strength(password: str, email: str) -> None:
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS:
        raise WeakPasswordError("Esa contraseña es demasiado común. Elige otra.")
    if len(set(lowered)) <= 2:
        raise WeakPasswordError("La contraseña no puede repetir siempre los mismos caracteres.")
    # Contexto del propio usuario: quien conozca su email lo probaría primero.
    local_part = email.split("@")[0].lower()
    if len(local_part) >= 4 and local_part in lowered:
        raise WeakPasswordError("La contraseña no puede contener tu email.")
