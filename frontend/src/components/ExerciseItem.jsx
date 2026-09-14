export default function ExerciseItem({
    exercise,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
}) {
    function handleDelete() {
        const confirmed = window.confirm(
            `Deseja remover ${exercise.kind === 'cardio' ? 'este cardio' : 'este exercício'}?`
        )

        if (confirmed) {
            onDelete(exercise.id)
        }
    }

    return (
        <div className="exercise-item">
            <div className="exercise-info">
                <div className="exercise-title-row">
                    <h3>{exercise.name}</h3>
                    <span className="activity-badge">
                        {exercise.kind === 'cardio' ? 'Cardio' : 'Musculação'}
                    </span>
                </div>

                {exercise.kind === 'cardio' ? (
                    <p>Duração: {exercise.cardio_duration_minutes} min</p>
                ) : (
                    <>
                        <p>Séries: {exercise.target_sets}</p>
                        <p>Repetições: {exercise.target_reps}</p>
                        <p>Descanso: {exercise.target_rest_seconds}s</p>
                        <p>
                            Carga planejada: {exercise.target_load ?? 0} kg
                            {exercise.load_per_dumbbell ? ' por halter' : ''}
                        </p>
                    </>
                )}
            </div>

            <div className="exercise-actions">
                <button
                    type="button"
                    className="icon-button"
                    title="Mover para cima"
                    aria-label="Mover para cima"
                    disabled={isFirst}
                    onClick={onMoveUp}
                >
                    ↑
                </button>
                <button
                    type="button"
                    className="icon-button"
                    title="Mover para baixo"
                    aria-label="Mover para baixo"
                    disabled={isLast}
                    onClick={onMoveDown}
                >
                    ↓
                </button>
                <button type="button" onClick={() => onEdit(exercise)}>
                    Editar
                </button>
                <button type="button" onClick={handleDelete}>
                    Remover
                </button>
            </div>
        </div>
    )
}
