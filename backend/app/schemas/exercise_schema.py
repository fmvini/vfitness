from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

ExerciseKind = Literal["resistance", "cardio"]


class ExerciseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    kind: ExerciseKind = "resistance"
    target_sets: int | None = Field(default=None, gt=0)
    target_reps: str | None = Field(default=None, min_length=1, max_length=20)
    target_load: float | None = Field(default=None, ge=0)
    load_per_dumbbell: bool = False
    target_rest_seconds: int | None = Field(default=None, ge=0)
    cardio_duration_minutes: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_kind_fields(self) -> "ExerciseBase":
        if self.kind == "cardio":
            if self.cardio_duration_minutes is None:
                raise ValueError("Informe o tempo do cardio em minutos.")
            self.target_sets = None
            self.target_reps = None
            self.target_load = None
            self.load_per_dumbbell = False
            self.target_rest_seconds = None
            return self

        if self.target_sets is None or self.target_reps is None:
            raise ValueError("Informe series e repeticoes do exercicio.")
        if self.target_rest_seconds is None:
            raise ValueError("Informe o tempo de descanso do exercicio.")
        self.cardio_duration_minutes = None
        return self


class ExerciseCreate(ExerciseBase):
    order_index: int | None = Field(default=None, ge=0)


class ExerciseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    kind: ExerciseKind | None = None
    target_sets: int | None = Field(default=None, gt=0)
    target_reps: str | None = Field(default=None, min_length=1, max_length=20)
    target_load: float | None = Field(default=None, ge=0)
    load_per_dumbbell: bool | None = None
    target_rest_seconds: int | None = Field(default=None, ge=0)
    cardio_duration_minutes: int | None = Field(default=None, gt=0)
    order_index: int | None = Field(default=None, ge=0)


class ExerciseReorder(BaseModel):
    exercise_id: int
    order_index: int = Field(..., ge=0)


class ExerciseRead(ExerciseBase):
    id: int
    workout_id: int
    order_index: int

    model_config = ConfigDict(from_attributes=True)
