from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings


ALGORITHM = "HS256"


def create_access_token(
    data: dict,
    expires_minutes: int | None = None,
) -> str:
    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
        or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update(
        {
            "exp": expire,
        }
    )

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:
        return None


def get_user_id_from_token(
    token: str,
) -> int | None:
    payload = decode_access_token(token)

    if not payload:
        return None

    user_id = payload.get("sub")

    if user_id is None:
        return None

    return int(user_id)