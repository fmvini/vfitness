import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { getWorkouts } from '../api/workoutApi'
import {
    findTodayWorkout,
    getCurrentWeekday,
    getWeekdayLabel
} from '../utils/weekdayDetector'

export default function TodayWorkoutPage() {
    const [todayWorkout, setTodayWorkout] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadTodayWorkout() {
            try {
                setTodayWorkout(findTodayWorkout(await getWorkouts()))
            } catch (err) {
                setError('Não foi possível carregar o treino do dia.')
            } finally {
                setLoading(false)
            }
        }

        loadTodayWorkout()
    }, [])

    if (loading) {
        return <main className="today-page"><p>Carregando treino do dia...</p></main>
    }

    if (todayWorkout) {
        return <Navigate to={`/workouts/${todayWorkout.id}/session`} replace />
    }

    return (
        <main className="today-page">
            <h1>Treino do dia</h1>
            {error ? (
                <p className="form-error">{error}</p>
            ) : (
                <div className="empty-state">
                    <h2>Nenhum treino para hoje</h2>
                    <p>
                        Não há treino associado a {getWeekdayLabel(
                            getCurrentWeekday()
                        )}.
                    </p>
                    <Link className="button" to="/">Configurar treinos</Link>
                </div>
            )}
        </main>
    )
}
