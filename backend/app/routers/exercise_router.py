"""
routers/exercise_router.py

Rotas de gestao de exercicios dentro de um treino (secao 2.3) e de
registro/consulta de execucoes, o ExerciseLog (secao 2.5). O escopo nao
define um router separado para logs: por serem sempre criados e
consultados no contexto de um exercicio, ficam aninhados aqui.

Toda rota exige um usuario autenticado. A validacao de que o exercicio (ou
o treino pai) pertence ao usuario logado fica em
app/services/workout_service.py, mantendo este arquivo focado em HTTP.

Este router mistura dois recursos com caminhos proprios
(/workouts/{workout_id}/exercises... e /exercises/{exercise_id}...), entao
deve ser incluido em main.py SEM prefixo (prefix=""), diferente dos
demais routers.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.exercise_schema import (
    ExerciseCreate,
    ExerciseRead,
    ExerciseReorder,
    ExerciseUpdate,
)
from app.schemas.log_schema import ExerciseLogCreate, ExerciseLogRead
from app.services.auth_service import get_current_user
from app.services.workout_service import (
    add_exercise,
    create_exercise_log,
    delete_exercise,
    get_exercise,
    list_exercise_logs,
    reorder_exercises,
    update_exercise,
)

router = APIRouter()


# --- Exercicios ---


@router.post(
    "/workouts/{workout_id}/exercises",
    response_model=ExerciseRead,
    status_code=status.HTTP_201_CREATED,
)
def add(
    workout_id: int,
    exercise_in: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    """Adiciona um exercicio a um treino existente (secao 2.3)."""
    return add_exercise(
        db, workout_id=workout_id, user_id=current_user.id, exercise_in=exercise_in
    )


@router.get("/exercises/{exercise_id}", response_model=ExerciseRead)
def get_one(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    """Retorna o detalhe de um exercicio especifico."""
    return get_exercise(db, exercise_id=exercise_id, user_id=current_user.id)


@router.patch("/exercises/{exercise_id}", response_model=ExerciseRead)
def update(
    exercise_id: int,
    exercise_in: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExerciseRead:
    """Edita um exercicio existente (secao 2.3)."""
    return update_exercise(
        db, exercise_id=exercise_id, user_id=current_user.id, exercise_in=exercise_in
    )


@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove um exercicio de um treino (secao 2.3)."""
    delete_exercise(db, exercise_id=exercise_id, user_id=current_user.id)
    return None


@router.patch(
    "/workouts/{workout_id}/exercises/reorder",
    response_model=list[ExerciseRead],
)
def reorder(
    workout_id: int,
    reorder_in: list[ExerciseReorder],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseRead]:
    """
    Reordena os exercicios dentro de um treino.

    Funcionalidade opcional, prevista para fase avancada (secao 2.3 e
    Fase 11 do escopo).
    """
    return reorder_exercises(
        db, workout_id=workout_id, user_id=current_user.id, reorder_in=reorder_in
    )


# --- Historico de execucao (ExerciseLog) ---


@router.post(
    "/exercises/{exercise_id}/logs",
    response_model=ExerciseLogRead,
    status_code=status.HTTP_201_CREATED,
)
def log_execution(
    exercise_id: int,
    log_in: ExerciseLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExerciseLogRead:
    """
    Registra a execucao real de um exercicio: carga usada, repeticoes e
    series completadas (secao 2.5).
    """
    return create_exercise_log(
        db, exercise_id=exercise_id, user_id=current_user.id, log_in=log_in
    )


@router.get("/exercises/{exercise_id}/logs", response_model=list[ExerciseLogRead])
def list_logs(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExerciseLogRead]:
    """
    Lista o historico de execucoes de um exercicio, usado para acompanhar
    a evolucao de carga ao longo do tempo (secao 2.6).
    """
    return list_exercise_logs(db, exercise_id=exercise_id, user_id=current_user.id)
