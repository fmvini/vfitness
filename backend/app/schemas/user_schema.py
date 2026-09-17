"""
schemas/user_schema.py

Schemas Pydantic para validacao de entrada e saida relacionadas ao User:
cadastro, login e o token JWT retornado apos autenticacao (secao 2.1).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Campos comuns a criacao e leitura de um usuario."""

    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr


class UserCreate(UserBase):
    """Dados recebidos no cadastro tradicional (email e senha, secao 2.1)."""

    password: str = Field(..., min_length=8, max_length=128)
    accept_terms: bool = Field(..., description="Aceite dos Termos de Uso e da Política de Privacidade")


class UserLogin(BaseModel):
    """Dados recebidos no login tradicional (email e senha)."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class UserRead(UserBase):
    """
    Dados do usuario retornados pela API.

    Nunca inclui password_hash ou google_id: sao detalhes internos de
    autenticacao, sem utilidade para o frontend.
    """

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """
    Resposta padrao apos autenticacao bem-sucedida, seja login tradicional
    ou via Google (secao 2.1). Usada pelo frontend para manter a sessao
    persistente do usuario.
    """

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Dados decodificados a partir do payload do JWT, usados internamente
    pela dependencia de autenticacao para identificar o usuario logado."""

    user_id: int | None = None
