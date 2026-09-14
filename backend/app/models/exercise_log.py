"""
models/exercise_log.py

Modelo ORM da entidade ExerciseLog (historico de execucao de um exercicio).

Cada execucao real de um exercicio, durante um treino, gera um registro
aqui, vinculado a data/hora e ao Exercise correspondente. Ao longo do
tempo, um mesmo Exercise acumula varios ExerciseLogs, permitindo calcular
estatisticas de evolucao (secao 2.6, "Estatisticas e Progresso").
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.exercise import Exercise
    from app.models.user import User


class ExerciseLog(Base):
    """
    Representa uma execucao real de um exercicio, com os valores
    efetivamente realizados pelo usuario (carga, repeticoes, series).

    Relacionamentos:
        - Um ExerciseLog pertence a um Exercise.
        - Um ExerciseLog tambem referencia diretamente o User. Essa
          referencia e redundante em relacao a Exercise -> Workout -> User,
          mas simplifica e acelera as consultas de estatisticas agregadas
          por usuario e periodo (secao 2.6), evitando joins longos.
    """

    __tablename__ = "exercise_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    performed_sets: Mapped[int | None] = mapped_column(nullable=True)

    # String para acomodar tanto um valor unico ("10") quanto repeticoes
    # que variaram entre series ("10,9,8")
    performed_reps: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Carga efetivamente usada na execucao, em kg
    performed_load: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    load_per_dumbbell: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    performed_duration_minutes: Mapped[int | None] = mapped_column(nullable=True)

    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # --- Relacionamentos ---
    exercise: Mapped["Exercise"] = relationship(back_populates="logs")

    user: Mapped["User"] = relationship(back_populates="exercise_logs")

    def __repr__(self) -> str:
        return (
            f"<ExerciseLog id={self.id} exercise_id={self.exercise_id} "
            f"performed_at={self.performed_at.isoformat()}>"
        )
