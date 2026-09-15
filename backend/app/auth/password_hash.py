from passlib.context import CryptContext


pwd_context = CryptContext(
    # Pre-hash evita truncar senhas acima de 72 bytes; bcrypt legado continua valido.
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)


def hash_password(
    password: str,
) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )
