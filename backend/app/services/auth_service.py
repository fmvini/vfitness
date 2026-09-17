"""
services/auth_service.py

Regras de negocio de autenticacao: cadastro, login tradicional, login com
Google e a dependencia get_current_user, que identifica o usuario logado
a partir do token JWT em cada requisicao autenticada (secao 2.1).

Este modulo nao lida com detalhes de baixo nivel de hashing ou JWT: essas
responsabilidades ficam em app/auth/ (password_hash.py, jwt_handler.py,
google_oauth.py), que ainda serao implementados. Contrato assumido aqui:

- hash_password(password) -> str
- verify_password(plain_password, hashed_password) -> bool
- create_access_token(data: dict) -> str
- decode_access_token(token) -> dict | None  (None se invalido/expirado)
- verify_google_id_token(id_token) -> GoogleUserInfo | None
  (objeto com .sub, .email, .name; None se o token nao for valido)

Ao criar app/auth/, seguir esse contrato ou ajustar as chamadas abaixo.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.google_oauth import verify_google_id_token
from app.auth.jwt_handler import create_access_token, decode_access_token
from app.auth.password_hash import hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user_schema import Token, UserCreate, UserLogin

if TYPE_CHECKING:
    from app.auth.google_oauth import GoogleUserInfo

# tokenUrl aponta para a rota de login tradicional; usado apenas para o
# botao "Authorize" do Swagger (/docs) funcionar (Fase 2, passo 4).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca um usuario pelo email. Retorna None se nao existir."""
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def register_user(db: Session, user_in: UserCreate) -> Token:
    """
    Cadastra um novo usuario com email e senha (secao 2.1).

    Levanta 400 se o email ja estiver em uso. Retorna um token de acesso
    imediatamente apos o cadastro, para que o usuario nao precise logar em
    seguida.
    """
    if not user_in.accept_terms:
        raise HTTPException(status_code=422, detail="Aceite os Termos de Uso para criar sua conta.")
    if get_user_by_email(db, user_in.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email ja esta cadastrado.",
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        accepted_terms_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token(user)


def authenticate_user(db: Session, credentials: UserLogin) -> Token:
    """
    Autentica um usuario com email e senha (secao 2.1).

    Levanta 401 se o email nao existir, a senha nao conferir, ou se o
    usuario tiver se cadastrado apenas via Google (sem password_hash).
    """
    user = get_user_by_email(db, credentials.email)

    if user is None or user.password_hash is None:
        raise _invalid_credentials_error()

    if not verify_password(credentials.password, user.password_hash):
        raise _invalid_credentials_error()

    return _build_token(user)


def authenticate_or_create_google_user(db: Session, id_token: str, accept_terms: bool = False) -> Token:
    """
    Autentica um usuario via Google OAuth, criando a conta automaticamente
    no primeiro acesso ou associando a uma conta tradicional existente com
    o mesmo email (secao 2.1 e Fase 9 do escopo).

    Levanta 401 se o id_token nao for valido junto ao Google.
    """
    google_user: "GoogleUserInfo | None" = verify_google_id_token(id_token)

    if google_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Google invalido ou expirado.",
        )
    if not accept_terms:
        raise HTTPException(status_code=422, detail="Aceite os Termos de Uso para entrar com o Google.")

    stmt = select(User).where(User.google_id == google_user.sub)
    user = db.execute(stmt).scalar_one_or_none()

    if user is None:
        # Pode existir uma conta tradicional com o mesmo email: nesse
        # caso, associa o google_id em vez de criar um usuario duplicado.
        user = get_user_by_email(db, google_user.email)

        if user is not None:
            user.google_id = google_user.sub
        else:
            user = User(
                name=google_user.name,
                email=google_user.email,
                google_id=google_user.sub,
                accepted_terms_at=datetime.now(timezone.utc),
            )
            db.add(user)

        if user.accepted_terms_at is None:
            user.accepted_terms_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(user)

    if user.accepted_terms_at is None:
        user.accepted_terms_at = datetime.now(timezone.utc)
        db.commit()
    return _build_token(user)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """
    Dependencia do FastAPI que identifica o usuario autenticado a partir
    do token JWT enviado no header Authorization.

    Usada por todas as rotas protegidas (workouts, exercises, stats) para
    garantir que cada usuario so acesse os proprios dados (secao 4).
    """
    payload = decode_access_token(token)
    if payload is None:
        raise _credentials_error()

    user_id = payload.get("sub")
    if user_id is None:
        raise _credentials_error()

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise _credentials_error() from None
    user = db.get(User, user_id)
    if user is None:
        raise _credentials_error()

    return user


def _build_token(user: User) -> Token:
    """Gera o Token de acesso para um usuario ja autenticado/cadastrado."""
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


def _invalid_credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email ou senha invalidos.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )
