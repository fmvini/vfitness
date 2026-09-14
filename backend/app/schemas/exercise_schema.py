"""
schemas/exercise_schema.py

Schemas Pydantic para validacao de entrada e saida relacionadas ao
Exercise (exercicio dentro de um treino): criacao, edicao, reordenacao e
leitura (secao 2.3 do escopo).
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ExerciseBase(BaseModel):
    """Campos comuns a criacao e edicao de um exercicio."""

    name: str = Field(..., min_length=1, max_length=120)
    target_sets: int = Field(..., gt=0)
    # Aceita um valor fixo ("12") ou uma faixa ("8-12"), conforme secao 2.3
    target_reps: str = Field(..., min_length=1, max_length=20)
    # Carga planejada, em kg. Opcional: ver nota em models/exercise.py
    # sobre a divergencia entre as secoes 2.3 e 4.4 do escopo original.
    target_load: float | None = Field(default=None, ge=0)
    target_rest_seconds: int = Field(..., ge=0)


class ExerciseCreate(ExerciseBase):
    """
    Dados recebidos ao adicionar um exercicio a um treino.

    order_index e opcional: quando nao informado, o backend deve calcular
    automaticamente a proxima posicao disponivel dentro do treino.
    """

    order_index: int | None = None


class ExerciseUpdate(BaseModel):
    """
    Dados recebidos na edicao de um exercicio existente (secao 2.3).
    Todos os campos sao opcionais, permitindo atualizar apenas o que mudou.
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    target_sets: int | None = Field(default=None, gt=0)
    target_reps: str | None = Field(default=None, min_length=1, max_length=20)
    target_load: float | None = Field(default=None, ge=0)
    target_rest_seconds: int | None = Field(default=None, ge=0)
    order_index: int | None = None


class ExerciseReorder(BaseModel):
    """
    Payload para reordenar exercicios dentro de um treino.
    Funcionalidade opcional, prevista para fase avancada (secao 2.3).
    """

    exercise_id: int
    order_index: int = Field(..., ge=0)


class ExerciseRead(ExerciseBase):
    """Dados de um exercicio retornados pela API."""

    id: int
    workout_id: int
    order_index: int

    model_config = ConfigDict(from_attributes=True)
