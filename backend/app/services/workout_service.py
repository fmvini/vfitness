from sqlalchemy.orm import Session

from app.models.workout import Workout
from app.models.exercise import Exercise


class WorkoutService:

    @staticmethod
    def create_workout(
        db: Session,
        user_id: int,
        name: str,
        weekday: str | None = None,
    ) -> Workout:
        workout = Workout(
            user_id=user_id,
            name=name,
            weekday=weekday,
        )

        db.add(workout)
        db.commit()
        db.refresh(workout)

        return workout

    @staticmethod
    def get_workouts_by_user(
        db: Session,
        user_id: int,
    ) -> list[Workout]:
        return (
            db.query(Workout)
            .filter(Workout.user_id == user_id)
            .order_by(Workout.created_at.desc())
            .all()
        )

    @staticmethod
    def get_workout_by_id(
        db: Session,
        workout_id: int,
        user_id: int,
    ) -> Workout | None:
        return (
            db.query(Workout)
            .filter(
                Workout.id == workout_id,
                Workout.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def update_workout(
        db: Session,
        workout: Workout,
        name: str | None = None,
        weekday: str | None = None,
    ) -> Workout:
        if name is not None:
            workout.name = name

        workout.weekday = weekday

        db.commit()
        db.refresh(workout)

        return workout

    @staticmethod
    def delete_workout(
        db: Session,
        workout: Workout,
    ) -> None:
        db.delete(workout)
        db.commit()

    @staticmethod
    def get_workout_for_today(
        db: Session,
        user_id: int,
        weekday: str,
    ) -> Workout | None:
        return (
            db.query(Workout)
            .filter(
                Workout.user_id == user_id,
                Workout.weekday == weekday,
            )
            .first()
        )

    @staticmethod
    def add_exercise(
        db: Session,
        workout_id: int,
        name: str,
        target_sets: int,
        target_reps: str,
        target_rest_seconds: int,
    ) -> Exercise:
        last_exercise = (
            db.query(Exercise)
            .filter(Exercise.workout_id == workout_id)
            .order_by(Exercise.order_index.desc())
            .first()
        )

        order_index = (
            last_exercise.order_index + 1
            if last_exercise
            else 1
        )

        exercise = Exercise(
            workout_id=workout_id,
            name=name,
            target_sets=target_sets,
            target_reps=target_reps,
            target_rest_seconds=target_rest_seconds,
            order_index=order_index,
        )

        db.add(exercise)
        db.commit()
        db.refresh(exercise)

        return exercise

    @staticmethod
    def get_exercises(
        db: Session,
        workout_id: int,
    ) -> list[Exercise]:
        return (
            db.query(Exercise)
            .filter(Exercise.workout_id == workout_id)
            .order_by(Exercise.order_index.asc())
            .all()
        )

    @staticmethod
    def update_exercise(
        db: Session,
        exercise: Exercise,
        name: str,
        target_sets: int,
        target_reps: str,
        target_rest_seconds: int,
    ) -> Exercise:
        exercise.name = name
        exercise.target_sets = target_sets
        exercise.target_reps = target_reps
        exercise.target_rest_seconds = target_rest_seconds

        db.commit()
        db.refresh(exercise)

        return exercise

    @staticmethod
    def delete_exercise(
        db: Session,
        exercise: Exercise,
    ) -> None:
        db.delete(exercise)
        db.commit()