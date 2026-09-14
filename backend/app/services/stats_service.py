from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.exercise_log import ExerciseLog


class StatsService:

    @staticmethod
    def get_total_volume(
        db: Session,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> float:
        volume = (
            db.query(
                func.sum(
                    ExerciseLog.performed_load
                    * ExerciseLog.performed_sets
                    * ExerciseLog.performed_reps
                )
            )
            .filter(
                ExerciseLog.user_id == user_id,
                ExerciseLog.performed_at >= start_date,
                ExerciseLog.performed_at <= end_date,
            )
            .scalar()
        )

        return float(volume or 0)

    @staticmethod
    def get_daily_volume(
        db: Session,
        user_id: int,
    ) -> float:
        now = datetime.now()

        start = now.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        return StatsService.get_total_volume(
            db,
            user_id,
            start,
            now,
        )

    @staticmethod
    def get_weekly_volume(
        db: Session,
        user_id: int,
    ) -> float:
        now = datetime.now()
        start = now - timedelta(days=7)

        return StatsService.get_total_volume(
            db,
            user_id,
            start,
            now,
        )

    @staticmethod
    def get_monthly_volume(
        db: Session,
        user_id: int,
    ) -> float:
        now = datetime.now()
        start = now - timedelta(days=30)

        return StatsService.get_total_volume(
            db,
            user_id,
            start,
            now,
        )

    @staticmethod
    def get_exercise_progress(
        db: Session,
        exercise_id: int,
        days: int = 30,
    ) -> list[dict]:
        start_date = datetime.now() - timedelta(days=days)

        logs = (
            db.query(ExerciseLog)
            .filter(
                ExerciseLog.exercise_id == exercise_id,
                ExerciseLog.performed_at >= start_date,
            )
            .order_by(ExerciseLog.performed_at.asc())
            .all()
        )

        return [
            {
                "date": log.performed_at.date(),
                "load": log.performed_load,
                "sets": log.performed_sets,
                "reps": log.performed_reps,
            }
            for log in logs
        ]

    @staticmethod
    def get_training_frequency(
        db: Session,
        user_id: int,
        days: int = 30,
    ) -> int:
        start_date = datetime.now() - timedelta(days=days)

        result = (
            db.query(
                func.count(
                    func.distinct(
                        func.date(ExerciseLog.performed_at)
                    )
                )
            )
            .filter(
                ExerciseLog.user_id == user_id,
                ExerciseLog.performed_at >= start_date,
            )
            .scalar()
        )

        return int(result or 0)

    @staticmethod
    def get_top_progress_exercises(
        db: Session,
        user_id: int,
        limit: int = 5,
    ) -> list[dict]:
        start_date = datetime.now() - timedelta(days=30)

        logs = (
            db.query(ExerciseLog)
            .join(
                Exercise,
                Exercise.id == ExerciseLog.exercise_id,
            )
            .filter(
                ExerciseLog.user_id == user_id,
                ExerciseLog.performed_at >= start_date,
            )
            .order_by(
                Exercise.name,
                ExerciseLog.performed_at.asc(),
            )
            .all()
        )

        progress_map = {}

        for log in logs:
            exercise_name = log.exercise.name

            if exercise_name not in progress_map:
                progress_map[exercise_name] = {
                    "first": log.performed_load,
                    "last": log.performed_load,
                }
            else:
                progress_map[exercise_name]["last"] = (
                    log.performed_load
                )

        ranking = []

        for name, values in progress_map.items():
            ranking.append(
                {
                    "exercise": name,
                    "progress": values["last"] - values["first"],
                }
            )

        ranking.sort(
            key=lambda item: item["progress"],
            reverse=True,
        )

        return ranking[:limit]