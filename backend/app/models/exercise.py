"""
models/exercise.py

Modelo ORM da entidade Exercise (exercicio dentro de um treino).

Cada Exercise pertence a um unico Workout e define os valores planejados
(series, repeticoes, carga, descanso) que servem de referencia quando o
usuario executa o treino e registra um ExerciseLog.

Nota: a secao 2.3 do escopo lista "Carga (peso, em kg)" como um dos campos
preenchidos ao adicionar um exercicio, mas o resumo da secao 4.4 nao inclui
esse campo no modelo. Optou-se por manter target_load aqui (nullable, para
nao quebrar caso a carga planejada nao seja informada) de modo a atender o
requisito funcional 2.3. Vale confirmar essa decisao com o restante do time
antes da migracao definitiva no Alembic.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.exercise_log import ExerciseLog
    from app.models.workout import Workout


class Exercise(Base):
    """
    Representa um exercicio planejado dentro de um treino (Workout).

    Relacionamentos:
        - Um Exercise pertence a um Workout.
        - Um Exercise possui varios ExerciseLogs, um por execucao real ao
          longo do tempo, permitindo rastrear evolucao (secoes 2.5 e 2.6).
    """

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)

    target_sets: Mapped[int] = mapped_column(nullable=False)

    # String para suportar tanto um valor fixo ("12") quanto uma faixa
    # de repeticoes ("8-12"), conforme secao 2.3
    target_reps: Mapped[str] = mapped_column(String(20), nullable=False)

    # Carga planejada, em kg. Ver nota no topo do arquivo sobre a
    # divergencia entre as secoes 2.3 e 4.4 do escopo.
    target_load: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    target_rest_seconds: Mapped[int] = mapped_column(nullable=False)

    # Posicao do exercicio dentro do treino, usada para reordenar
    # (funcionalidade opcional prevista para fase avancada, secao 2.3)
    order_index: Mapped[int] = mapped_column(nullable=False, default=0)

    # --- Relacionamentos ---
    workout: Mapped["Workout"] = relationship(back_populates="exercises")

    logs: Mapped[list["ExerciseLog"]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseLog.performed_at",
    )

    def __repr__(self) -> str:
        return (
            f"<Exercise id={self.id} name={self.name!r} "
            f"workout_id={self.workout_id}>"
        )
