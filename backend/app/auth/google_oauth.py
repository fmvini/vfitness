from __future__ import annotations

from dataclasses import dataclass

from app.config import settings


@dataclass(frozen=True)
class GoogleUserInfo:
    sub: str
    email: str
    name: str


def verify_google_id_token(credential: str) -> GoogleUserInfo | None:
    """
    Valida o ID token emitido pelo Google Identity Services.

    As dependencias do transporte HTTP sao importadas aqui para que o login
    tradicional continue funcionando mesmo quando o login Google nao estiver
    configurado no ambiente local.
    """
    if not settings.google_client_id:
        return None

    try:
        from google.auth.transport import requests
        from google.oauth2 import id_token

        payload = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            settings.google_client_id,
        )
    except (ImportError, ValueError):
        return None

    email = payload.get("email")
    sub = payload.get("sub")
    if not email or not sub:
        return None

    return GoogleUserInfo(
        sub=sub,
        email=email,
        name=payload.get("name") or email,
    )
