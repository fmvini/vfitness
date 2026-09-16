"""
routers/workout_router.py

Rotas de gestao de treinos (Workouts / presets): criar, listar, editar,
remover e visualizar o detalhe de um treino com seus exercicios
(secao 2.2 e Fases 4/5 do escopo).

Toda rota exige um usuario autenticado. A validacao de que o treino
pertence ao usuario logado, assim como as demais regras de negocio, ficam
em app/services/workout_service.py, mantendo este arquivo focado em HTTP.

Este router deve ser incluido em main.py com prefix="/workouts".
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.workout_schema import (
    WorkoutCreate,
    WorkoutDetail,
    WorkoutRead,
    WorkoutUpdate,
)
from app.services.auth_service import get_current_user
from app.services.workout_service import (
    create_workout,
    delete_workout,
    get_workout,
    list_workouts,
    update_workout,
)

router = APIRouter()


@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
def create(
    workout_in: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkoutRead:
    """Cria um novo treino (preset) para o usuario autenticado (secao 2.2)."""
    return create_workout(db, user_id=current_user.id, workout_in=workout_in)


@router.get("", response_model=list[WorkoutRead])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WorkoutRead]:
    """
    Lista todos os treinos cadastrados pelo usuario autenticado.

    A deteccao do treino do dia (secao 2.4) e feita no frontend a partir
    do campo weekday de cada treino retornado aqui
    (ver frontend/src/utils/weekdayDetector.js).
    """
    return list_workouts(db, user_id=current_user.id)


@router.get("/{workout_id}", response_model=WorkoutDetail)
def get_one(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkoutDetail:
    """
    Retorna o detalhe de um treino, incluindo seus exercicios planejados.
    Usado ao abrir um treino para execucao (secao 2.5).
    """
    return get_workout(db, workout_id=workout_id, user_id=current_user.id)


@router.patch("/{workout_id}", response_model=WorkoutRead)
def update(
    workout_id: int,
    workout_in: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkoutRead:
    """Edita o nome e/ou o dia da semana de um treino existente (secao 2.2)."""
    return update_workout(
        db, workout_id=workout_id, user_id=current_user.id, workout_in=workout_in
    )


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Remove um treino e, em cascata, seus exercicios e historico associado.

    A confirmacao mencionada na secao 2.2 ("com confirmacao, ja que isso
    tambem afeta o historico associado") e responsabilidade do frontend,
    exibida antes de chamar esta rota.
    """
    delete_workout(db, workout_id=workout_id, user_id=current_user.id)
    return None
