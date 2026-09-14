import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getWorkouts } from '../api/workoutApi'

export default function DashboardPage() {
    const [workouts, setWorkouts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWorkouts()
    }, [])

    async function loadWorkouts() {
        try {
            const data = await getWorkouts()
            setWorkouts(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <p>Carregando treinos...</p>
    }

    return (
        <div className="dashboard-page">
            <h1>Meus Treinos</h1>

            {workouts.length === 0 ? (
                <p>Nenhum treino cadastrado.</p>
            ) : (
                <div className="workout-list">
                    {workouts.map((workout) => (
                        <Link
                            key={workout.id}
                            to={`/workouts/${workout.id}`}
                            className="workout-card"
                        >
                            <h3>{workout.name}</h3>

                            <p>
                                Dia: {workout.weekday || 'Não definido'}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}