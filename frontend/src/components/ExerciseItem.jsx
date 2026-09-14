export default function ExerciseItem({
    exercise,
    onEdit,
    onDelete
}) {
    function handleDelete() {
        const confirmed = window.confirm(
            'Deseja remover este exercício?'
        )

        if (confirmed) {
            onDelete(exercise.id)
        }
    }

    return (
        <div className="exercise-item">
            <div className="exercise-info">
                <h3>{exercise.name}</h3>

                <p>
                    Séries: {exercise.target_sets}
                </p>

                <p>
                    Repetições: {exercise.target_reps}
                </p>

                <p>
                    Descanso:{' '}
                    {exercise.target_rest_seconds}s
                </p>

                {exercise.load !== undefined && (
                    <p>
                        Carga: {exercise.load} kg
                    </p>
                )}
            </div>

            <div className="exercise-actions">
                <button
                    type="button"
                    onClick={() => onEdit(exercise)}
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