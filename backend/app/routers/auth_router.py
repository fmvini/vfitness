"""
routers/auth_router.py

Rotas de autenticacao: cadastro, login tradicional, login com Google,
logout e verificacao da sessao atual (secao 2.1 do escopo).

Regras de negocio (hash de senha, geracao/validacao de JWT, integracao com
o Google) ficam em app/services/auth_service.py e app/auth/, mantendo este
arquivo focado apenas em receber a requisicao e devolver a resposta HTTP.

Este router deve ser incluido em main.py com prefix="/auth".
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user_schema import Token, UserCreate, UserLogin, UserRead
from app.services.auth_service import (
    authenticate_or_create_google_user,
    authenticate_user,
    get_current_user,
    register_user,
)

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    """
    Payload minimo para o login com Google (secao 2.1 e Fase 9).

    id_token e o credential (JWT) emitido pelo Google Identity Services no
    frontend, validado junto ao Google em app/auth/google_oauth.py.
    """

    id_token: str
    accept_terms: bool = False


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Token:
    """
    Cadastra um novo usuario com email e senha (secao 2.1).

    Retorna um token de acesso imediatamente apos o cadastro, para que o
    usuario nao precise fazer login logo em seguida.
    """
    return register_user(db, user_in)


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)) -> Token:
    """
    Autentica um usuario com email e senha e retorna um token JWT.

    O token retornado deve ter validade longa o suficiente para manter a
    sessao persistente do usuario (secao 2.1: "o usuario nao precisa logar
    toda vez que abrir a pagina").
    """
    return authenticate_user(db, credentials)


@router.post("/google", response_model=Token)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> Token:
    """
    Autentica um usuario via Google OAuth, criando a conta automaticamente
    se for o primeiro acesso ou associando a um usuario ja existente com o
    mesmo email (secao 2.1 e Fase 9 do escopo).

    O frontend envia o credential emitido pelo Google Identity Services e
    o backend valida audiencia, assinatura e validade antes de autenticar.
    """
    return authenticate_or_create_google_user(db, payload.id_token, payload.accept_terms)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user)) -> None:
    """
    Encerra a sessao do usuario atual (secao 2.1).

    Como a autenticacao usa JWT stateless, o backend nao mantem sessao em
    servidor: o logout efetivo acontece quando o frontend descarta o token
    armazenado apos essa chamada. Esta rota exige um token valido antes do
    descarte e serve como ponto de extensao futuro, caso o projeto adote
    uma blocklist de tokens revogados.
    """
    return None


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Retorna os dados do usuario autenticado atual.

    Usado pelo frontend para revalidar a sessao ao recarregar a pagina,
    sem exigir um novo login (Fase 3, passo 5: "Persistir sessao").
    """
    return current_user
