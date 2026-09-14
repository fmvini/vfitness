import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getWorkoutById, registerExerciseLog } from '../api/workoutApi'
import { getWeekdayLabel } from '../utils/weekdayDetector'

function repetitionTarget(value) {
    const numbers = String(value || '').match(/\d+/g)?.map(Number) || [1]
    return Math.max(...numbers, 1)
}

function createExerciseProgress(exercise) {
    if (exercise.kind === 'cardio') {
        return {
            complete: false,
            duration: exercise.cardio_duration_minutes
        }
    }

    const repetitions = repetitionTarget(exercise.target_reps)
    return {
        complete: false,
        load: exercise.target_load ?? 0,
        sets: Array.from(
            { length: exercise.target_sets },
            () => Array.from({ length: repetitions }, () => false)
        )
    }
}

function localDateKey() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default function WorkoutSessionPage() {
    const { id } = useParams()
    const [workout, setWorkout] = useState(null)
    const [progress, setProgress] = useState({})
    const [finished, setFinished] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const storageKey = `vfitness-session-${id}-${localDateKey()}`

    useEffect(() => {
        async function loadWorkout() {
            try {
                const data = await getWorkoutById(id)
                const initial = Object.fromEntries(
                    data.exercises.map((exercise) => [
                        exercise.id,
                        createExerciseProgress(exercise)
                    ])
                )
                let stored = null
                try {
                    stored = JSON.parse(localStorage.getItem(storageKey) || 'null')
                } catch (error) {
                    localStorage.removeItem(storageKey)
                }
                setWorkout(data)
                setProgress({ ...initial, ...(stored?.progress || {}) })
                setFinished(Boolean(stored?.finished))
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    'Não foi possível carregar o treino.'
                )
            } finally {
                setLoading(false)
            }
        }

        loadWorkout()
    }, [id, storageKey])

    useEffect(() => {
        if (workout && Object.keys(progress).length) {
            localStorage.setItem(
                storageKey,
                JSON.stringify({ progress, finished })
            )
        }
    }, [finished, progress, storageKey, workout])

    const completedCount = useMemo(
        () => Object.values(progress).filter((item) => item.complete).length,
        [progress]
    )

    function updateProgress(exerciseId, updater) {
        setProgress((current) => ({
            ...current,
            [exerciseId]: updater(current[exerciseId])
        }))
    }

    function toggleExercise(exercise) {
        updateProgress(exercise.id, (current) => {
            const complete = !current.complete
            if (exercise.kind === 'cardio') {
                return { ...current, complete }
            }
            return {
                ...current,
                complete,
                sets: current.sets.map((set) => set.map(() => complete))
            }
        })
    }

    function toggleRepetition(exerciseId, setIndex, repetitionIndex) {
        updateProgress(exerciseId, (current) => {
            const sets = current.sets.map((set, currentSetIndex) =>
                set.map((checked, currentRepetitionIndex) =>
                    currentSetIndex === setIndex && currentRepetitionIndex === repetitionIndex
                        ? !checked
                        : checked
                )
            )
            return {
                ...current,
                sets,
                complete: sets.every((set) => set.every(Boolean))
            }
        })
    }

    async function finishWorkout() {
        const completedExercises = workout.exercises.filter(
            (exercise) => progress[exercise.id]?.complete
        )
        if (!completedExercises.length) {
            setError('Marque ao menos uma atividade como concluída.')
            return
        }

        try {
            setSaving(true)
            setError('')
            await Promise.all(completedExercises.map((exercise) => {
                const activityProgress = progress[exercise.id]
                if (exercise.kind === 'cardio') {
                    return registerExerciseLog(exercise.id, {
                        performed_duration_minutes: Number(activityProgress.duration)
                    })
                }

                const repetitions = activityProgress.sets.map(
                    (set) => set.filter(Boolean).length
                )
                return registerExerciseLog(exercise.id, {
                    performed_sets: repetitions.length,
                    performed_reps: repetitions.join(','),
                    performed_load: Number(activityProgress.load)
                })
            }))
            setFinished(true)
            setMessage('Treino registrado no histórico.')
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível finalizar o treino.'
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <main className="workout-session-page"><p>Preparando treino...</p></main>
    }

    if (!workout) {
        return (
            <main className="workout-session-page">
                <p className="form-error">{error}</p>
                <Link className="text-link" to="/">Voltar aos treinos</Link>
            </main>
        )
    }

    const totalActivities = workout.exercises.length
    const completionPercentage = totalActivities
        ? Math.round((completedCount / totalActivities) * 100)
        : 0

    return (
        <main className="workout-session-page">
            <div className="session-header">
                <div>
                    <span className="session-label">Treino em andamento</span>
                    <h1>{workout.name}</h1>
                    <p>{getWeekdayLabel(workout.weekday)}</p>
                </div>
                <Link className="button-secondary button" to={`/workouts/${workout.id}/edit`}>
                    Configurar treino
                </Link>
            </div>

            <div className="session-progress" aria-label={`${completionPercentage}% concluído`}>
                <div>
                    <strong>{completedCount} de {totalActivities}</strong>
                    <span> atividades concluídas</span>
                </div>
                <div className="progress-track">
                    <span style={{ width: `${completionPercentage}%` }} />
                </div>
            </div>

            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}

            {!totalActivities ? (
                <div className="empty-state">
                    <h2>Treino sem atividades</h2>
                    <p>Adicione exercícios ou cardio antes de iniciar.</p>
                    <Link className="button" to={`/workouts/${workout.id}/edit`}>
                        Adicionar atividades
                    </Link>
                </div>
            ) : (
                <div className="session-exercises">
                    {workout.exercises.map((exercise, exerciseIndex) => {
                        const activityProgress = progress[exercise.id]
                        if (!activityProgress) {
                            return null
                        }

                        return (
                            <section
                                key={exercise.id}
                                className={`session-card${activityProgress.complete ? ' complete' : ''}`}
                            >
                                <div className="session-card-header">
                                    <span className="exercise-number">{exerciseIndex + 1}</span>
                                    <div>
                                        <h2>{exercise.name}</h2>
                                        <p>
                                            {exercise.kind === 'cardio'
                                                ? `${exercise.cardio_duration_minutes} minutos planejados`
                                                : `${exercise.target_sets} séries de ${exercise.target_reps} repetições`}
                                        </p>
                                    </div>
                                    <label className="completion-check">
                                        <input
                                            type="checkbox"
                                            checked={activityProgress.complete}
                                            disabled={finished}
                                            onChange={() => toggleExercise(exercise)}
                                        />
                                        <span>Concluído</span>
                                    </label>
                                </div>

                                {exercise.kind === 'cardio' ? (
                                    <label className="session-value-field">
                                        Tempo realizado
                                        <small>Informe a duração em minutos.</small>
                                        <input
                                            type="number"
                                            min="1"
                                            value={activityProgress.duration}
                                            disabled={finished}
                                            onChange={(event) => updateProgress(
                                                exercise.id,
                                                (current) => ({
                                                    ...current,
                                                    duration: event.target.value
                                                })
                                            )}
                                        />
                                    </label>
                                ) : (
                                    <>
                                        <div className="session-load-row">
                                            <label className="session-value-field">
                                                Carga usada (kg)
                                                <small>
                                                    {exercise.load_per_dumbbell
                                                        ? 'Peso de um halter. O total considera os dois.'
                                                        : 'Carga efetivamente usada no exercício.'}
                                                </small>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={activityProgress.load}
                                                    disabled={finished}
                                                    onChange={(event) => updateProgress(
                                                        exercise.id,
                                                        (current) => ({
                                                            ...current,
                                                            load: event.target.value
                                                        })
                                                    )}
                                                />
                                            </label>
                                            <span>{exercise.target_rest_seconds}s de descanso</span>
                                        </div>

                                        <div className="sets-list">
                                            {activityProgress.sets.map((set, setIndex) => (
                                                <div key={setIndex} className="set-row">
                                                    <strong>Série {setIndex + 1}</strong>
                                                    <div className="repetition-checks">
                                                        {set.map((checked, repetitionIndex) => (
                                                            <label key={repetitionIndex}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    disabled={finished}
                                                                    onChange={() => toggleRepetition(
                                                                        exercise.id,
                                                                        setIndex,
                                                                        repetitionIndex
                                                                    )}
                                                                />
                                                                <span>{repetitionIndex + 1}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </section>
                        )
                    })}
                </div>
            )}

            {totalActivities > 0 && (
                <div className="finish-bar">
                    <div>
                        <strong>{completionPercentage}% concluído</strong>
                        <p>As atividades marcadas serão salvas no histórico.</p>
                    </div>
                    <button
                        type="button"
                        onClick={finishWorkout}
                        disabled={saving || finished}
                    >
                        {finished ? 'Treino finalizado' : saving ? 'Salvando...' : 'Finalizar treino'}
                    </button>
                </div>
            )}
        </main>
    )
}
