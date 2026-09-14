"""
database.py

Configura a conexao com o PostgreSQL via SQLAlchemy: engine, fabrica de
sessoes e a classe base declarativa usada pelos modelos ORM (app/models/).
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings


def normalize_database_url(database_url: str) -> str:
    """
    SQLAlchemy 2 expects the canonical postgresql:// dialect name.

    Some hosted providers and dashboards still show postgres:// connection
    strings, so normalize that common variant before creating the engine.
    """
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)

    return database_url


# Engine: ponto central de conexao com o banco de dados.
# pool_pre_ping evita erros de conexao "caida" apos periodos de inatividade
# (comum em bancos hospedados na nuvem, ex: Render/Railway).
engine = create_engine(
    normalize_database_url(settings.database_url),
    pool_pre_ping=True,
    echo=settings.debug,
    # Supabase gerencia o pool; cada instancia serverless libera a conexao.
    **({"poolclass": NullPool, "connect_args": {"connect_timeout": 10}}
       if settings.environment == "production" else {}),
)

# Fabrica de sessoes. Cada requisicao da API deve usar sua propria sessao,
# criada e fechada automaticamente pela dependencia get_db() abaixo.
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """
    Classe base declarativa para todos os modelos ORM do projeto
    (User, Workout, Exercise, ExerciseLog em app/models/).

    Exemplo de uso em um modelo:
        from app.database import Base

        class User(Base):
            __tablename__ = "users"
            ...
    """

    pass


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia do FastAPI que fornece uma sessao de banco por requisicao
    e garante o fechamento da conexao ao final, mesmo em caso de erro.

    Uso em uma rota:
        from fastapi import Depends
        from app.database import get_db

        def minha_rota(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
