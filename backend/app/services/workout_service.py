from __future__ import annotations

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.exercise import Exercise
from app.models.exercise_log import ExerciseLog
from app.models.workout import Workout
from app.schemas.exercise_schema import ExerciseCreate, ExerciseReorder, ExerciseUpdate
from app.schemas.log_schema import ExerciseLogCreate
from app.schemas.workout_schema import WorkoutCreate, WorkoutUpdate


def _not_found(resource: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} nao encontrado.",
    )


def _owned_workout(db: Session, workout_id: int, user_id: int) -> Workout:
    workout = db.scalar(
        select(Workout).where(
            Workout.id == workout_id,
            Workout.user_id == user_id,
        )
    )
    if workout is None:
        raise _not_found("Treino")
    return workout


def _owned_exercise(db: Session, exercise_id: int, user_id: int) -> Exercise:
    exercise = db.scalar(
        select(Exercise)
        .join(Workout, Workout.id == Exercise.workout_id)
        .where(
            Exercise.id == exercise_id,
            Workout.user_id == user_id,
        )
    )
    if exercise is None:
        raise _not_found("Exercicio")
    return exercise


def create_workout(
    db: Session, user_id: int, workout_in: WorkoutCreate
) -> Workout:
    data = workout_in.model_dump()
    days = data.pop("weekdays")
    data["weekdays"] = days if days is not None else ([data["weekday"]] if data["weekday"] else [])
    data["weekday"] = data["weekdays"][0] if data["weekdays"] else None
    workout = Workout(user_id=user_id, **data)
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


def list_workouts(db: Session, user_id: int) -> list[Workout]:
    return list(
        db.scalars(
            select(Workout)
            .where(Workout.user_id == user_id)
            .order_by(Workout.created_at.desc())
        ).all()
    )


def get_workout(db: Session, workout_id: int, user_id: int) -> Workout:
    workout = db.scalar(
        select(Workout)
        .options(selectinload(Workout.exercises))
        .where(
            Workout.id == workout_id,
            Workout.user_id == user_id,
        )
    )
    if workout is None:
        raise _not_found("Treino")
    return workout


def update_workout(
    db: Session,
    workout_id: int,
    user_id: int,
    workout_in: WorkoutUpdate,
) -> Workout:
    workout = _owned_workout(db, workout_id, user_id)
    data = workout_in.model_dump(exclude_unset=True)
    if "weekdays" in data:
        days = data.pop("weekdays") or []
        data["weekdays"] = days
        data["weekday"] = days[0] if days else None
    elif "weekday" in data:
        data["weekdays"] = [data["weekday"]] if data["weekday"] else []
    for field, value in data.items():
        setattr(workout, field, value)
    db.commit()
    db.refresh(workout)
    return workout


def delete_workout(db: Session, workout_id: int, user_id: int) -> None:
    workout = _owned_workout(db, workout_id, user_id)
    db.delete(workout)
    db.commit()


def add_exercise(
    db: Session,
    workout_id: int,
    user_id: int,
    exercise_in: ExerciseCreate,
) -> Exercise:
    _owned_workout(db, workout_id, user_id)
    data = exercise_in.model_dump()
    if data["order_index"] is None:
        current_max = db.scalar(
            select(func.max(Exercise.order_index)).where(
                Exercise.workout_id == workout_id
            )
        )
        data["order_index"] = (current_max or 0) + 1

    exercise = Exercise(workout_id=workout_id, **data)
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


def get_exercise(db: Session, exercise_id: int, user_id: int) -> Exercise:
    return _owned_exercise(db, exercise_id, user_id)


def update_exercise(
    db: Session,
    exercise_id: int,
    user_id: int,
    exercise_in: ExerciseUpdate,
) -> Exercise:
    exercise = _owned_exercise(db, exercise_id, user_id)
    current = {
        "name": exercise.name,
        "kind": exercise.kind,
        "target_sets": exercise.target_sets,
        "target_reps": exercise.target_reps,
        "target_load": float(exercise.target_load)
        if exercise.target_load is not None
        else None,
        "load_per_dumbbell": exercise.load_per_dumbbell,
        "target_rest_seconds": exercise.target_rest_seconds,
        "cardio_duration_minutes": exercise.cardio_duration_minutes,
        "order_index": exercise.order_index,
    }
    current.update(exercise_in.model_dump(exclude_unset=True))
    try:
        validated = ExerciseCreate(**current)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(include_context=False),
        ) from exc

    for field, value in validated.model_dump(exclude={"order_index"}).items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return exercise


def delete_exercise(db: Session, exercise_id: int, user_id: int) -> None:
    exercise = _owned_exercise(db, exercise_id, user_id)
    db.delete(exercise)
    db.commit()


def reorder_exercises(
    db: Session,
    workout_id: int,
    user_id: int,
    reorder_in: list[ExerciseReorder],
) -> list[Exercise]:
    _owned_workout(db, workout_id, user_id)
    exercise_ids = [item.exercise_id for item in reorder_in]
    if len(exercise_ids) != len(set(exercise_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A lista de reordenacao contem exercicios duplicados.",
        )

    exercises = list(
        db.scalars(
            select(Exercise).where(
                Exercise.workout_id == workout_id,
                Exercise.id.in_(exercise_ids),
            )
        ).all()
    )
    if len(exercises) != len(exercise_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Um ou mais exercicios nao pertencem a este treino.",
        )

    positions = {item.exercise_id: item.order_index for item in reorder_in}
    for exercise in exercises:
        exercise.order_index = positions[exercise.id]
    db.commit()

    return list(
        db.scalars(
            select(Exercise)
            .where(Exercise.workout_id == workout_id)
            .order_by(Exercise.order_index.asc())
        ).all()
    )


def create_exercise_log(
    db: Session,
    exercise_id: int,
    user_id: int,
    log_in: ExerciseLogCreate,
) -> ExerciseLog:
    exercise = _owned_exercise(db, exercise_id, user_id)
    data = log_in.model_dump(exclude_none=True)

    if exercise.kind == "cardio":
        duration = data.get("performed_duration_minutes")
        if duration is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe o tempo realizado do cardio.",
            )
        data = {
            "performed_duration_minutes": duration,
            "load_per_dumbbell": False,
            **({"performed_at": data["performed_at"]} if "performed_at" in data else {}),
        }
    else:
        required = ("performed_sets", "performed_reps", "performed_load")
        if any(data.get(field) is None for field in required):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe series, repeticoes e carga realizadas.",
            )
        data["load_per_dumbbell"] = exercise.load_per_dumbbell

    exercise_log = ExerciseLog(
        exercise_id=exercise_id,
        user_id=user_id,
        **data,
    )
    db.add(exercise_log)
    db.commit()
    db.refresh(exercise_log)
    return exercise_log


def list_exercise_logs(
    db: Session, exercise_id: int, user_id: int
) -> list[ExerciseLog]:
    _owned_exercise(db, exercise_id, user_id)
    return list(
        db.scalars(
            select(ExerciseLog)
            .where(
                ExerciseLog.exercise_id == exercise_id,
                ExerciseLog.user_id == user_id,
            )
            .order_by(ExerciseLog.performed_at.desc())
        ).all()
    )
