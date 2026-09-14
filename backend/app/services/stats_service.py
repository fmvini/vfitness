from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.exercise import Exercise
from app.models.exercise_log import ExerciseLog
from app.models.workout import Workout


def _period_window(period: str) -> tuple[datetime, datetime, int]:
    now = datetime.now(timezone.utc)
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now, 1
    days = {"week": 7, "month": 30, "year": 365}.get(period, 30)
    return now - timedelta(days=days), now, days


def _total_repetitions(value: str, sets: int) -> int:
    try:
        repetitions = [int(part.strip()) for part in value.split(",")]
    except ValueError:
        return 0
    if len(repetitions) == 1:
        return repetitions[0] * sets
    return sum(repetitions)


def _exercise_for_user(
    db: Session, exercise_id: int, user_id: int
) -> Exercise:
    exercise = db.scalar(
        select(Exercise)
        .join(Workout, Workout.id == Exercise.workout_id)
        .where(
            Exercise.id == exercise_id,
            Workout.user_id == user_id,
        )
    )
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercicio nao encontrado.",
        )
    return exercise


def get_dashboard_stats(db: Session, user_id: int) -> dict:
    total_workouts = db.scalar(
        select(func.count(Workout.id)).where(Workout.user_id == user_id)
    ) or 0
    total_exercises = db.scalar(
        select(func.count(Exercise.id))
        .join(Workout, Workout.id == Exercise.workout_id)
        .where(Workout.user_id == user_id)
    ) or 0
    return {
        "total_workouts": int(total_workouts),
        "total_exercises": int(total_exercises),
        "active_exercises": int(total_exercises),
    }


def get_total_weight_lifted(db: Session, user_id: int, period: str) -> dict:
    start, end, _ = _period_window(period)
    logs = db.scalars(
        select(ExerciseLog).where(
            ExerciseLog.user_id == user_id,
            ExerciseLog.performed_at >= start,
            ExerciseLog.performed_at <= end,
        )
    ).all()
    total = sum(
        float(log.performed_load or 0)
        * _total_repetitions(log.performed_reps, log.performed_sets)
        * (2 if log.load_per_dumbbell else 1)
        for log in logs
        if log.performed_load is not None
        and log.performed_reps is not None
        and log.performed_sets is not None
    )
    return {"period": period, "total_weight_kg": round(total, 2)}


def get_exercise_progress(
    db: Session, user_id: int, exercise_id: int, period: str
) -> dict:
    exercise = _exercise_for_user(db, exercise_id, user_id)
    start, end, _ = _period_window(period)
    logs = db.scalars(
        select(ExerciseLog)
        .where(
            ExerciseLog.exercise_id == exercise_id,
            ExerciseLog.user_id == user_id,
            ExerciseLog.performed_at >= start,
            ExerciseLog.performed_at <= end,
            ExerciseLog.performed_load.is_not(None),
        )
        .order_by(ExerciseLog.performed_at.asc())
    ).all()
    return {
        "exercise_id": exercise.id,
        "exercise_name": exercise.name,
        "period": period,
        "points": [
            {
                "recorded_at": log.performed_at.date(),
                "load_kg": float(log.performed_load),
            }
            for log in logs
        ],
    }


def get_top_progress_exercises(
    db: Session, user_id: int, limit: int = 5
) -> list[dict]:
    start, end, _ = _period_window("month")
    logs = db.scalars(
        select(ExerciseLog)
        .options(joinedload(ExerciseLog.exercise))
        .where(
            ExerciseLog.user_id == user_id,
            ExerciseLog.performed_at >= start,
            ExerciseLog.performed_at <= end,
            ExerciseLog.performed_load.is_not(None),
        )
        .order_by(ExerciseLog.exercise_id, ExerciseLog.performed_at.asc())
    ).all()

    grouped: dict[int, list[ExerciseLog]] = {}
    for log in logs:
        grouped.setdefault(log.exercise_id, []).append(log)

    ranking = [
        {
            "exercise_id": exercise_id,
            "exercise_name": exercise_logs[0].exercise.name,
            "progress_kg": round(
                float(exercise_logs[-1].performed_load)
                - float(exercise_logs[0].performed_load),
                2,
            ),
        }
        for exercise_id, exercise_logs in grouped.items()
        if len(exercise_logs) >= 2
    ]
    ranking.sort(key=lambda item: item["progress_kg"], reverse=True)
    return ranking[:limit]


def get_training_frequency(db: Session, user_id: int, period: str) -> dict:
    start, end, days = _period_window(period)
    trained_dates = db.scalars(
        select(func.date(ExerciseLog.performed_at))
        .where(
            ExerciseLog.user_id == user_id,
            ExerciseLog.performed_at >= start,
            ExerciseLog.performed_at <= end,
        )
        .distinct()
    ).all()
    return {
        "period": period,
        "days_trained": len(trained_dates),
        "days_in_period": days,
    }
