"""
database.py

Configura a conexao com o PostgreSQL via SQLAlchemy: engine, fabrica de
sessoes e a classe base declarativa usada pelos modelos ORM (app/models/).
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# Engine: ponto central de conexao com o banco de dados.
# pool_pre_ping evita erros de conexao "caida" apos periodos de inatividade
# (comum em bancos hospedados na nuvem, ex: Render/Railway).
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.debug,
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
