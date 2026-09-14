"""
main.py

Ponto de entrada da API FastAPI do VFitness.

Nesta etapa (Fase 0 do escopo), a aplicacao expoe apenas a rota de
verificacao de saude (/health), usada para validar que o backend sobe
corretamente e consegue se comunicar com o frontend.

Os routers de negocio (auth, workouts, exercises, stats) serao registrados
aqui nas fases seguintes, quando app/routers/ for implementado.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "API do VFitness: gestao de treinos (presets), exercicios, "
        "execucoes e estatisticas de evolucao de carga."
    ),
)

# CORS: permite que o frontend React (Vite) faca chamadas HTTP para esta
# API durante o desenvolvimento e em producao.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check() -> dict:
    """
    Rota de verificacao de saude da API.

    Usada na Fase 0 para validar que backend (`uvicorn app.main:app --reload`)
    e frontend (`npm run dev`) sobem corretamente e conseguem se comunicar.
    """
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
    }


# --- Registro de routers (proximas fases) ---
# A medida que os recursos forem implementados, registrar aqui, por exemplo:
#
# from app.routers import auth_router, workout_router, exercise_router, stats_router
#
# app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
# app.include_router(workout_router.router, prefix="/workouts", tags=["workouts"])
# app.include_router(exercise_router.router, prefix="/exercises", tags=["exercises"])
# app.include_router(stats_router.router, prefix="/stats", tags=["stats"])
