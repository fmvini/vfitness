import { Link } from 'react-router-dom'

export default function WorkoutCard({
    workout,
    onDelete
}) {
    function handleDelete() {
        const confirmed = window.confirm(
            'Deseja remover este treino?'
        )

        if (confirmed) {
            onDelete(workout.id)
        }
    }

    return (
        <div className="workout-card">
            <h3>{workout.name}</h3>

            <p>
                Dia: {workout.weekday || 'Não definido'}
            </p>

            <div className="workout-card-actions">
                <Link to={`/workouts/${workout.id}`}>
                    Abrir
                </Link>

                <button
                    type="button"
                    onClick={handleDelete}
                >
                    Remover
                </button>
            </div>
        </div>
    )
}