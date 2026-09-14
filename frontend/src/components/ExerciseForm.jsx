import { useState } from 'react'

export default function ExerciseForm({ initialData = null, onSubmit }) {
    const [kind, setKind] = useState(initialData?.kind || 'resistance')
    const [name, setName] = useState(initialData?.name || '')
    const [targetSets, setTargetSets] = useState(initialData?.target_sets || 3)
    const [targetReps, setTargetReps] = useState(initialData?.target_reps || '10')
    const [targetLoad, setTargetLoad] = useState(initialData?.target_load ?? 0)
    const [loadPerDumbbell, setLoadPerDumbbell] = useState(
        initialData?.load_per_dumbbell || false
    )
    const [restSeconds, setRestSeconds] = useState(
        initialData?.target_rest_seconds || 60
    )
    const [cardioMinutes, setCardioMinutes] = useState(
        initialData?.cardio_duration_minutes || 20
    )

    function handleSubmit(event) {
        event.preventDefault()

        if (kind === 'cardio') {
            onSubmit({
                name,
                kind,
                cardio_duration_minutes: Number(cardioMinutes)
            })
            return
        }

        onSubmit({
            name,
            kind,
            target_sets: Number(targetSets),
            target_reps: targetReps,
            target_load: Number(targetLoad),
            load_per_dumbbell: loadPerDumbbell,
            target_rest_seconds: Number(restSeconds)
        })
    }

    return (
        <form className="exercise-form" onSubmit={handleSubmit}>
            <div className="activity-type" aria-label="Tipo de atividade">
                <button
                    type="button"
                    className={kind === 'resistance' ? 'active' : ''}
                    onClick={() => setKind('resistance')}
                >
                    Musculação
                </button>
                <button
                    type="button"
                    className={kind === 'cardio' ? 'active' : ''}
                    onClick={() => setKind('cardio')}
                >
                    Cardio
                </button>
            </div>

            <div className={`exercise-fields ${kind === 'cardio' ? 'cardio-fields' : ''}`}>
                <label>
                    {kind === 'cardio' ? 'Nome do cardio' : 'Nome do exercício'}
                    <small>
                        {kind === 'cardio'
                            ? 'Exemplo: bicicleta ou esteira.'
                            : 'Use um nome fácil de reconhecer.'}
                    </small>
                    <input
                        type="text"
                        placeholder={kind === 'cardio' ? 'Bicicleta' : 'Supino reto'}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </label>

                {kind === 'cardio' ? (
                    <label>
                        Tempo em minutos
                        <small>Duração planejada para esta atividade.</small>
                        <input
                            type="number"
                            min="1"
                            value={cardioMinutes}
                            onChange={(event) => setCardioMinutes(event.target.value)}
                            required
                        />
                    </label>
                ) : (
                    <>
                        <label>
                            Séries
                            <small>Quantidade de séries planejadas.</small>
                            <input
                                type="number"
                                min="1"
                                value={targetSets}
                                onChange={(event) => setTargetSets(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Repetições
                            <small>Valor fixo ou faixa, como 8-12.</small>
                            <input
                                type="text"
                                value={targetReps}
                                onChange={(event) => setTargetReps(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Carga (kg)
                            <small>Peso usado em cada repetição.</small>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={targetLoad}
                                onChange={(event) => setTargetLoad(event.target.value)}
                            />
                        </label>
                        <label>
                            Descanso (segundos)
                            <small>Intervalo entre as séries.</small>
                            <input
                                type="number"
                                min="0"
                                value={restSeconds}
                                onChange={(event) => setRestSeconds(event.target.value)}
                                required
                            />
                        </label>
                        <label className="checkbox-field dumbbell-option">
                            <input
                                type="checkbox"
                                checked={loadPerDumbbell}
                                onChange={(event) => setLoadPerDumbbell(event.target.checked)}
                            />
                            <span>
                                Carga por halter
                                <small>Informe acima o peso de apenas um halter.</small>
                            </span>
                        </label>
                    </>
                )}
            </div>

            <button type="submit" className="exercise-submit">
                {initialData ? 'Salvar alterações' : `Adicionar ${kind === 'cardio' ? 'cardio' : 'exercício'}`}
            </button>
        </form>
    )
}
