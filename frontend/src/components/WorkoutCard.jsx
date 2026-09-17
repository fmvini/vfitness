import { Link } from 'react-router-dom'
import { getWeekdaysLabel } from '../utils/weekdayDetector'

export default function WorkoutCard({
    workout, onDelete, onEdit, isToday = false, isTodayOverride = false
}) {
    function handleDelete() {
        if (window.confirm(`Remover o treino “${workout.name}”? Esta ação não pode ser desfeita.`)) {
            onDelete(workout.id)
        }
    }

    return (
        <article className={`workout-card${isToday ? ' workout-card-today' : ''}`}>
            <div className="workout-card-day">
                <span>{getWeekdaysLabel(workout)}</span>
                {isToday && <strong>{isTodayOverride ? 'Escolhido para hoje' : 'Hoje'}</strong>}
            </div>
            <div className="workout-card-main">
                <h3>{workout.name}</h3>
                {isToday && <p>Pronto para começar.</p>}
            </div>
            <div className="workout-card-actions">
                <Link className="button button-small" to={isToday ? '/today' : `/workouts/${workout.id}/session`}>
                    Iniciar
                </Link>
                <Link className="text-link" to={`/workouts/${workout.id}/edit`}>Atividades</Link>
                <button type="button" className="text-button" onClick={() => onEdit(workout)}>Editar</button>
                <button type="button" className="text-button danger-text" onClick={handleDelete}>Remover</button>
            </div>
        </article>
    )
}
