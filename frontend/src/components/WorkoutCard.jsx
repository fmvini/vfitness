import { Link } from 'react-router-dom'
import { getWorkoutWeekdayLabels } from '../utils/weekdayDetector'

export default function WorkoutCard({
    workout,
    onDelete,
    onEdit,
    isToday = false,
    isTodayOverride = false
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
        <div className={`workout-card${isToday ? ' workout-card-today' : ''}`}>
            {isToday && (
                <span className="today-label">
                    {isTodayOverride ? 'Escolhido para hoje' : 'Treino de hoje'}
                </span>
            )}
            <h3>{workout.name}</h3>

            <p>
                Dias: {getWorkoutWeekdayLabels(workout)}
            </p>

            <div className="workout-card-actions">
                <Link to={isToday ? '/today' : `/workouts/${workout.id}/session`}>
                    Abrir treino
                </Link>

                <Link
                    to={`/workouts/${workout.id}/edit`}
                    className="button-secondary"
                >
                    Exercícios
                </Link>

                <button
                    type="button"
                    onClick={() => onEdit(workout)}
                >
                    Editar
                </button>

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
