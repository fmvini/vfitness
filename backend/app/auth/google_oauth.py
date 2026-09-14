from google.auth.transport import requests
from google.oauth2 import id_token

from app.config import settings


class GoogleOAuthService:

    @staticmethod
    def verify_google_token(
        credential: str,
    ) -> dict | None:
        try:
            payload = id_token.verify_oauth2_token(
                credential,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            return {
                "google_id": payload["sub"],
                "email": payload["email"],
                "name": payload.get("name"),
                "picture": payload.get("picture"),
                "email_verified": payload.get(
                    "email_verified",
                    False,
                ),
            }

        except ValueError:
            return None