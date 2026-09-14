"""
schemas/log_schema.py

Schemas Pydantic para validacao de entrada e saida relacionadas ao
ExerciseLog (historico de execucao de um exercicio): registro da execucao
real e leitura do historico (secoes 2.5 e 2.6 do escopo).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExerciseLogBase(BaseModel):
    """Campos comuns ao registrar a execucao real de um exercicio."""

    performed_sets: int = Field(..., gt=0)
    # String para acomodar tanto um valor unico ("10") quanto repeticoes
    # que variaram entre series ("10,9,8")
    performed_reps: str = Field(..., min_length=1, max_length=20)
    performed_load: float = Field(..., ge=0)


class ExerciseLogCreate(ExerciseLogBase):
    """
    Dados recebidos ao registrar a execucao de um exercicio (secao 2.5).

    exercise_id e user_id nao fazem parte do payload: o exercicio vem do
    parametro de rota (ex: POST /exercises/{exercise_id}/logs) e o usuario
    vem do token JWT autenticado, evitando que alguem registre execucoes
    em nome de outro usuario (regra de seguranca da secao 4).

    performed_at e opcional: quando omitido, o backend deve usar o
    momento atual do registro; quando informado, permite lancar uma
    execucao passada (ex: treino feito offline e registrado depois).
    """

    performed_at: datetime | None = None


class ExerciseLogUpdate(BaseModel):
    """
    Dados recebidos ao corrigir um registro de execucao ja existente.

    Nao prevista explicitamente na secao 2.5 do escopo, mas mantida para
    permitir a correcao de erros de digitacao no historico sem precisar
    remover e recriar o registro. Todos os campos sao opcionais.
    """

    performed_sets: int | None = Field(default=None, gt=0)
    performed_reps: str | None = Field(default=None, min_length=1, max_length=20)
    performed_load: float | None = Field(default=None, ge=0)
    performed_at: datetime | None = None


class ExerciseLogRead(ExerciseLogBase):
    """Dados de um registro de execucao retornados pela API."""

    id: int
    exercise_id: int
    user_id: int
    performed_at: datetime

    model_config = ConfigDict(from_attributes=True)
