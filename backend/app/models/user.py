"""
models/user.py

Modelo ORM da entidade User (usuario da aplicacao).

Um usuario pode se cadastrar com email e senha (login tradicional) ou via
Google OAuth (Fase 9 do escopo). Em ambos os casos o email e obrigatorio e
unico; password_hash e google_id sao complementares entre si, ja que um
usuario que loga via Google pode nao ter senha propria, e vice-versa.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.exercise_log import ExerciseLog
    from app.models.workout import Workout


class User(Base):
    """
    Representa um usuario da aplicacao.

    Relacionamentos:
        - Um User possui varios Workouts (treinos/presets cadastrados).
        - Um User possui varios ExerciseLogs. Essa referencia e redundante
          em relacao a Workout -> Exercise -> ExerciseLog, mas evita joins
          longos nas consultas de estatisticas por usuario (secao 2.6).
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    # Nulo quando o cadastro foi feito via Google (sem senha propria)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Nulo quando o usuario usa apenas login tradicional (email e senha)
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- Relacionamentos ---
    workouts: Mapped[list["Workout"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    exercise_logs: Mapped[list["ExerciseLog"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
