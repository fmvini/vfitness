"""
schemas/workout_schema.py

Schemas Pydantic para validacao de entrada e saida relacionadas ao Workout
(treino/preset): criacao, edicao, listagem e o detalhe de um treino com
seus exercicios (secoes 2.2 e 2.4 do escopo).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.workout import Weekday
from app.schemas.exercise_schema import ExerciseRead


class WorkoutBase(BaseModel):
    """Campos comuns a criacao e edicao de um treino."""

    name: str = Field(..., min_length=1, max_length=120)
    # Campo opcional: um treino pode nao ter dia fixo associado (secao 2.2)
    weekday: Weekday | None = None
    weekdays: list[Weekday] = Field(default_factory=list, max_length=7)

    @field_validator("weekdays")
    @classmethod
    def unique_weekdays(cls, value: list[Weekday]) -> list[Weekday]:
        if len(value) != len(set(value)):
            raise ValueError("Selecione cada dia da semana apenas uma vez.")
        return value


class WorkoutCreate(WorkoutBase):
    """Dados recebidos na criacao de um treino."""

    pass


class WorkoutUpdate(BaseModel):
    """
    Dados recebidos na edicao de um treino existente.

    Todos os campos sao opcionais: o usuario pode editar apenas o nome,
    apenas o dia da semana, ou ambos (secao 2.2).
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    weekday: Weekday | None = None
    weekdays: list[Weekday] | None = Field(default=None, max_length=7)

    @field_validator("weekdays")
    @classmethod
    def unique_weekdays(cls, value: list[Weekday] | None) -> list[Weekday] | None:
        if value is not None and len(value) != len(set(value)):
            raise ValueError("Selecione cada dia da semana apenas uma vez.")
        return value

    @field_validator("name")
    @classmethod
    def name_cannot_be_null(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("Informe o nome do treino.")
        return value


class WorkoutRead(WorkoutBase):
    """Dados de um treino retornados pela API, sem a lista de exercicios."""

    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkoutDetail(WorkoutRead):
    """
    Detalhe completo de um treino, incluindo os exercicios planejados.

    Usado ao abrir um treino para execucao (secao 2.5) ou ao exibir
    automaticamente o treino do dia (secao 2.4).
    """

    exercises: list[ExerciseRead] = []

    model_config = ConfigDict(from_attributes=True)
