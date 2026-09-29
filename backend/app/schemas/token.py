from pydantic import BaseModel


class Token(BaseModel):
    """Respuesta del endpoint de login: el token en sí y el tipo
    ('bearer' es el estándar OAuth2, indica cómo debe enviarse en
    peticiones futuras: header 'Authorization: Bearer <token>')."""

    access_token: str
    token_type: str = "bearer"