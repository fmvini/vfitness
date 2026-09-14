import { useState } from 'react'

export default function ExerciseForm({
    initialData = null,
    onSubmit
}) {
    const [name, setName] = useState(
        initialData?.name || ''
    )

    const [targetSets, setTargetSets] = useState(
        initialData?.target_sets || 3
    )

    const [targetReps, setTargetReps] = useState(
        initialData?.target_reps || '10'
    )

    const [load, setLoad] = useState(
        initialData?.load || 0
    )

    const [restSeconds, setRestSeconds] = useState(
        initialData?.target_rest_seconds || 60
    )

    function handleSubmit(event) {
        event.preventDefault()

        onSubmit({
            name,
            target_sets: Number(targetSets),
            target_reps: targetReps,
            load: Number(load),
            target_rest_seconds: Number(restSeconds)
        })
    }

    return (
        <form
            className="exercise-form"
            onSubmit={handleSubmit}
        >
            <input
                type="text"
                placeholder="Nome do exercício"
                value={name}
                onChange={(e) =>
                    setName(e.target.value)
                }
                required
            />

            <input
                type="number"
                placeholder="Séries"
                min="1"
                value={targetSets}
                onChange={(e) =>
                    setTargetSets(e.target.value)
                }
                required
            />

            <input
                type="text"
                placeholder="Repetições"
                value={targetReps}
                onChange={(e) =>
                    setTargetReps(e.target.value)
                }
                required
            />

            <input
                type="number"
                placeholder="Carga (kg)"
                min="0"
                step="0.5"
                value={load}
                onChange={(e) =>
                    setLoad(e.target.value)
                }
            />

            <input
                type="number"
                placeholder="Descanso (seg)"
                min="0"
                value={restSeconds}
                onChange={(e) =>
                    setRestSeconds(e.target.value)
                }
                required
            />

            <button type="submit">
                {initialData
                    ? 'Salvar alterações'
                    : 'Adicionar exercício'}
            </button>
        </form>
    )
}