"""
models/workout.py

Modelo ORM da entidade Workout (treino/preset).

Um Workout pertence a um unico User e pode, opcionalmente, estar associado
a um dia da semana (campo weekday). Quando associado, o sistema abre esse
treino automaticamente ao usuario acessar a pagina no dia correspondente
(secao 2.4, "Deteccao de Treino do Dia").
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.exercise import Exercise
    from app.models.user import User


class Weekday(str, enum.Enum):
    """Dias da semana suportados para associacao com um treino."""

    SEGUNDA = "segunda"
    TERCA = "terca"
    QUARTA = "quarta"
    QUINTA = "quinta"
    SEXTA = "sexta"
    SABADO = "sabado"
    DOMINGO = "domingo"


class Workout(Base):
    """
    Representa um treino (preset) cadastrado por um usuario.

    Relacionamentos:
        - Um Workout pertence a um User.
        - Um Workout possui varios Exercises, ordenados por order_index.
          Ao remover um Workout, os Exercises associados sao removidos em
          cascata (o frontend deve confirmar a exclusao com o usuario, ja
          que isso tambem afeta o historico, conforme secao 2.2).
    """

    __tablename__ = "workouts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)

    # Campo opcional: um treino pode nao ter dia fixo associado
    weekday: Mapped[Weekday | None] = mapped_column(
        SAEnum(Weekday, name="weekday_enum", native_enum=False),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # --- Relacionamentos ---
    user: Mapped["User"] = relationship(back_populates="workouts")

    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )

    def __repr__(self) -> str:
        return f"<Workout id={self.id} name={self.name!r} weekday={self.weekday}>"
