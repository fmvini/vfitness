"""
config.py

Centraliza as variaveis de ambiente e configuracoes da aplicacao VFitness.
Usa pydantic-settings para validacao declarativa dos valores, lidos de um
arquivo .env na raiz do backend (ver .env.example).
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Aplicacao ---
    app_name: str = "VFitness API"
    environment: str = "development"  # development | production
    debug: bool = True

    # --- Banco de dados (PostgreSQL) ---
    # Formato: postgresql+psycopg2://usuario:senha@host:porta/nome_do_banco
    database_url: str = "postgresql+psycopg2://vfitness:vfitness@localhost:5432/vfitness"

    # --- Autenticacao tradicional (JWT) ---
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    # Sessao persistente: token com validade longa para o usuario
    # nao precisar logar toda vez que abrir a pagina (secao 2.1 do escopo)
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 dias

    # --- Autenticacao Google OAuth (implementada na Fase 9) ---
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str | None = None

    # --- CORS ---
    # Origens permitidas a chamar a API. Em producao, substituir pela URL
    # real do frontend (Vercel/Netlify).
    cors_origins: list[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Retorna a instancia unica (cacheada) das configuracoes da aplicacao.

    Pode ser usada como dependencia do FastAPI quando necessario:
        def minha_rota(settings: Settings = Depends(get_settings)):
            ...
    """
    return Settings()


# Instancia padrao, pronta para import direto (ex: from app.config import settings)
settings = get_settings()
