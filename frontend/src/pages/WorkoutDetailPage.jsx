import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { getWorkoutById } from '../api/workoutApi'

export default function WorkoutDetailPage() {
    const { id } = useParams()

    const [workout, setWorkout] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorkout()
    }, [id])

    async function loadWorkout() {
        try {
            const data = await getWorkoutById(id)
            setWorkout(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <p>Carregando treino...</p>
    }

    if (!workout) {
        return <p>Treino não encontrado.</p>
    }

    return (
        <div className="workout-detail-page">
            <h1>{workout.name}</h1>

            <p>
                Dia associado: {workout.weekday || 'Não definido'}
            </p>

            <h2>Exercícios</h2>

            {workout.exercises?.length === 0 ? (
                <p>Nenhum exercício cadastrado.</p>
            ) : (
                <div>
                    {workout.exercises?.map((exercise) => (
                        <div
                            key={exercise.id}
                            className="exercise-card"
                        >
                            <h3>{exercise.name}</h3>

                            <p>
                                Séries: {exercise.target_sets}
                            </p>

                            <p>
                                Repetições: {exercise.target_reps}
                            </p>

                            <p>
                                Descanso: {exercise.target_rest_seconds}s
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}