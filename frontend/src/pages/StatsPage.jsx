import { useEffect, useState } from 'react'

import {
    getDashboardStats,
    getExerciseProgress,
    getTopProgressExercises,
    getTotalWeight,
    getWorkoutFrequency
} from '../api/statsApi'
import { getWorkoutById, getWorkouts } from '../api/workoutApi'
import ProgressChart from '../components/ProgressChart'

export default function StatsPage() {
    const [period, setPeriod] = useState('week')
    const [stats, setStats] = useState(null)
    const [frequency, setFrequency] = useState(null)
    const [totalWeight, setTotalWeight] = useState(null)
    const [topProgress, setTopProgress] = useState([])
    const [exercises, setExercises] = useState([])
    const [exerciseId, setExerciseId] = useState('')
    const [progress, setProgress] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadSummary()
    }, [period])

    useEffect(() => {
        loadExercises()
    }, [])

    useEffect(() => {
        if (exerciseId) {
            loadProgress(exerciseId)
        } else {
            setProgress(null)
        }
    }, [exerciseId, period])

    async function loadSummary() {
        try {
            setLoading(true)
            setError('')
            const frequencyPeriod = period === 'day' ? 'week' : period
            const [dashboardData, frequencyData, weightData, topData] =
                await Promise.all([
                    getDashboardStats(),
                    getWorkoutFrequency(frequencyPeriod),
                    getTotalWeight(period),
                    getTopProgressExercises()
                ])
            setStats(dashboardData)
            setFrequency(frequencyData)
            setTotalWeight(weightData)
            setTopProgress(topData)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível carregar as estatísticas.'
            )
        } finally {
            setLoading(false)
        }
    }

    async function loadExercises() {
        try {
            const workouts = await getWorkouts()
            const details = await Promise.all(
                workouts.map((workout) => getWorkoutById(workout.id))
            )
            const allExercises = details.flatMap((workout) =>
                workout.exercises.map((exercise) => ({
                    ...exercise,
                    workout_name: workout.name
                }))
            )
            setExercises(allExercises)
            if (allExercises.length) {
                setExerciseId(String(allExercises[0].id))
            }
        } catch (err) {
            setError('Não foi possível carregar os exercícios.')
        }
    }

    async function loadProgress(selectedExerciseId) {
        try {
            const progressPeriod = period === 'day' ? 'week' : period
            setProgress(
                await getExerciseProgress(selectedExerciseId, progressPeriod)
            )
        } catch (err) {
            setError('Não foi possível carregar a evolução de carga.')
        }
    }

    return (
        <main className="stats-page">
            <div className="page-heading stats-heading">
                <div>
                    <h1>Estatísticas</h1>
                    <p>Acompanhe frequência, volume e evolução de carga.</p>
                </div>
                <div className="period-control" aria-label="Período">
                    {['day', 'week', 'month'].map((value) => (
                        <button
                            key={value}
                            type="button"
                            className={period === value ? 'active' : ''}
                            onClick={() => setPeriod(value)}
                        >
                            {{ day: 'Dia', week: 'Semana', month: 'Mês' }[value]}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="form-error">{error}</p>}
            {loading ? <p>Carregando estatísticas...</p> : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Peso total</h3>
                            <p>{totalWeight?.total_weight_kg ?? 0} kg</p>
                        </div>
                        <div className="stat-card">
                            <h3>Dias treinados</h3>
                            <p>{frequency?.days_trained ?? 0}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Exercícios ativos</h3>
                            <p>{stats?.active_exercises ?? 0}</p>
                        </div>
                    </div>

                    <section className="stats-section">
                        <h2>Resumo cadastrado</h2>
                        <p>Treinos: {stats?.total_workouts ?? 0}</p>
                        <p>Exercícios: {stats?.total_exercises ?? 0}</p>
                    </section>

                    <section className="chart-section">
                        <div className="section-heading">
                            <h2>Evolução de carga</h2>
                            <select
                                value={exerciseId}
                                onChange={(event) => setExerciseId(event.target.value)}
                                aria-label="Exercício"
                            >
                                {!exercises.length && (
                                    <option value="">Nenhum exercício</option>
                                )}
                                {exercises.map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>
                                        {exercise.name}, {exercise.workout_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ProgressChart
                            data={progress?.points || []}
                            title={progress?.exercise_name || 'Evolução de carga'}
                        />
                    </section>

                    <section className="ranking-section">
                        <h2>Maior progresso em 30 dias</h2>
                        {!topProgress.length ? (
                            <p>Registre ao menos duas execuções para comparar cargas.</p>
                        ) : (
                            <ol className="progress-ranking">
                                {topProgress.map((item) => (
                                    <li key={item.exercise_id}>
                                        <span>{item.exercise_name}</span>
                                        <strong>{item.progress_kg} kg</strong>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </>
            )}
        </main>
    )
}
