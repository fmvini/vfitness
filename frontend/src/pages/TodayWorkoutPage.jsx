import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { getWorkouts } from '../api/workoutApi'
import { useAuth } from '../context/AuthContext'
import {
    resolveTodayWorkout,
    setDailyWorkoutSelection
} from '../utils/dailyWorkoutSelection'
import {
    getCurrentWeekday,
    getWeekdayLabel
} from '../utils/weekdayDetector'

export default function TodayWorkoutPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [workouts, setWorkouts] = useState([])
    const [selectedWorkoutId, setSelectedWorkoutId] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadTodayWorkout() {
            try {
                const data = await getWorkouts()
                setWorkouts(data)
                setSelectedWorkoutId(String(data[0]?.id || ''))
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

    const { workout: todayWorkout } = resolveTodayWorkout(
        workouts,
        user?.id
    )

    if (todayWorkout) {
        return (
            <Navigate
                to={`/workouts/${todayWorkout.id}/session?today=1`}
                replace
            />
        )
    }

    function chooseWorkoutForToday(event) {
        event.preventDefault()
        if (!selectedWorkoutId) {
            return
        }

        setDailyWorkoutSelection(user?.id, selectedWorkoutId)
        navigate(`/workouts/${selectedWorkoutId}/session?today=1`, {
            replace: true
        })
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
                    {workouts.length ? (
                        <form
                            className="today-workout-picker"
                            onSubmit={chooseWorkoutForToday}
                        >
                            <label>
                                Escolha um treino apenas para hoje
                                <select
                                    value={selectedWorkoutId}
                                    onChange={(event) => setSelectedWorkoutId(
                                        event.target.value
                                    )}
                                >
                                    {workouts.map((workout) => (
                                        <option key={workout.id} value={workout.id}>
                                            {workout.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit">Iniciar treino</button>
                        </form>
                    ) : (
                        <Link className="button" to="/">Configurar treinos</Link>
                    )}
                </div>
            )}
        </main>
    )
}
