"""
routers/stats_router.py

Rotas de estatisticas e progresso: peso total levantado por periodo,
evolucao de carga de um exercicio, exercicios com maior progresso recente
e frequencia de treinos (secao 2.6 do escopo).

As agregacoes propriamente ditas ficam em app/services/stats_service.py;
este arquivo apenas recebe os parametros da requisicao e devolve a
resposta HTTP.

Este router deve ser incluido em main.py com prefix="/stats".

Os schemas de resposta abaixo sao especificos deste router. Caso a secao
de estatisticas cresca, faz sentido promove-los para um stats_schema.py
dedicado em app/schemas/, seguindo o padrao dos demais recursos.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.stats_service import (
    get_dashboard_stats,
    get_exercise_progress,
    get_top_progress_exercises,
    get_total_weight_lifted,
    get_training_frequency,
)

router = APIRouter()

# "dia" so se aplica ao peso total levantado; os graficos de evolucao e a
# frequencia aceitam semana, mes ou ano (secao 2.6).
Period = Literal["day", "week", "month", "year"]
ProgressPeriod = Literal["week", "month", "year"]


# --- Schemas de resposta ---


class TotalWeightResponse(BaseModel):
    """Peso total levantado (carga x series x repeticoes) no periodo."""

    period: Period
    total_weight_kg: float


class ProgressPoint(BaseModel):
    """Um ponto do grafico de evolucao de carga de um exercicio."""

    recorded_at: date
    load_kg: float


class ExerciseProgressResponse(BaseModel):
    """Serie historica de carga de um exercicio, para o grafico da secao 2.6."""

    exercise_id: int
    exercise_name: str
    period: ProgressPeriod
    points: list[ProgressPoint]


class TopProgressItem(BaseModel):
    """Um exercicio com progresso recente de carga."""

    exercise_id: int
    exercise_name: str
    progress_kg: float


class TrainingFrequencyResponse(BaseModel):
    """Frequencia de treinos realizados dentro de um periodo."""

    period: ProgressPeriod
    days_trained: int
    days_in_period: int


class DashboardStatsResponse(BaseModel):
    total_workouts: int
    total_exercises: int
    active_exercises: int


# --- Rotas ---


@router.get("/dashboard", response_model=DashboardStatsResponse)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStatsResponse:
    return get_dashboard_stats(db, user_id=current_user.id)


@router.get("/total-weight", response_model=TotalWeightResponse)
def total_weight(
    period: Period = Query("week", description="dia, semana ou mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TotalWeightResponse:
    """
    Peso total levantado (somatorio de carga x series x repeticoes) no
    dia, na semana ou no mes (secao 2.6).
    """
    return get_total_weight_lifted(db, user_id=current_user.id, period=period)


@router.get(
    "/exercises/{exercise_id}/progress", response_model=ExerciseProgressResponse
)
def exercise_progress(
    exercise_id: int,
    period: ProgressPeriod = Query("month", description="semana ou mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExerciseProgressResponse:
    """
    Evolucao de carga de um exercicio especifico, comparando a ultima
    semana ou o ultimo mes (secao 2.6).
    """
    return get_exercise_progress(
        db, user_id=current_user.id, exercise_id=exercise_id, period=period
    )


@router.get("/top-progress", response_model=list[TopProgressItem])
def top_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TopProgressItem]:
    """Lista os exercicios com maior progresso recente de carga (secao 2.6)."""
    return get_top_progress_exercises(db, user_id=current_user.id)


@router.get("/frequency", response_model=TrainingFrequencyResponse)
def frequency(
    period: ProgressPeriod = Query("week", description="semana ou mes"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TrainingFrequencyResponse:
    """
    Frequencia de treinos: quantos dias treinados na semana ou no mes
    (secao 2.6).
    """
    return get_training_frequency(db, user_id=current_user.id, period=period)
