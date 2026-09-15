import { useEffect, useMemo, useState } from 'react'
import {
    Link,
    useNavigate,
    useParams,
    useSearchParams
} from 'react-router-dom'

import {
    getWorkoutById,
    getWorkouts,
    registerExerciseLog
} from '../api/workoutApi'
import { useAuth } from '../context/AuthContext'
import {
    clearDailyWorkoutSelection,
    resolveTodayWorkout,
    setDailyWorkoutSelection
} from '../utils/dailyWorkoutSelection'
import {
    getCurrentWeekday,
    getWeekdayLabel
} from '../utils/weekdayDetector'

function plannedRepetitions(value) {
    const repetitions = Number(String(value || '').match(/\d+/)?.[0])
    return Math.max(repetitions || 1, 1)
}

function createExerciseProgress(exercise) {
    if (exercise.kind === 'cardio') {
        return {
            complete: false,
            duration: exercise.cardio_duration_minutes
        }
    }

    return {
        complete: false,
        load: exercise.target_load ?? 0,
        sets: Array.from({ length: exercise.target_sets }, () => false)
    }
}

function mergeStoredProgress(exercises, initial, storedProgress) {
    return Object.fromEntries(exercises.map((exercise) => {
        const base = initial[exercise.id]
        const stored = storedProgress?.[exercise.id]
        if (!stored) {
            return [exercise.id, base]
        }

        if (exercise.kind === 'cardio') {
            return [exercise.id, { ...base, ...stored }]
        }

        const storedSets = Array.isArray(stored.sets) ? stored.sets : []
        const sets = base.sets.map((_, index) => {
            const savedSet = storedSets[index]
            return Array.isArray(savedSet)
                ? savedSet.length > 0 && savedSet.every(Boolean)
                : Boolean(savedSet)
        })

        return [exercise.id, {
            ...base,
            ...stored,
            sets,
            complete: sets.length > 0 && sets.every(Boolean)
        }]
    }))
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
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user } = useAuth()
    const isTodaySession = searchParams.get('today') === '1'
    const [workout, setWorkout] = useState(null)
    const [allWorkouts, setAllWorkouts] = useState([])
    const [switchOpen, setSwitchOpen] = useState(false)
    const [replacementId, setReplacementId] = useState('')
    const [switchError, setSwitchError] = useState('')
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
                setLoading(true)
                setError('')
                setMessage('')
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
                setProgress(mergeStoredProgress(data.exercises, initial, stored?.progress))
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
        if (!isTodaySession) {
            return
        }

        async function loadWorkoutOptions() {
            try {
                setSwitchError('')
                const data = await getWorkouts()
                setAllWorkouts(data)
                const firstAlternative = data.find(
                    (item) => String(item.id) !== String(id)
                )
                setReplacementId(String(firstAlternative?.id || ''))
            } catch (err) {
                setSwitchError('Não foi possível carregar os outros treinos.')
            }
        }

        loadWorkoutOptions()
    }, [id, isTodaySession])

    useEffect(() => {
        if (
            workout &&
            String(workout.id) === String(id) &&
            Object.keys(progress).length
        ) {
            localStorage.setItem(
                storageKey,
                JSON.stringify({ progress, finished })
            )
        }
    }, [finished, id, progress, storageKey, workout])

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
                sets: current.sets.map(() => complete)
            }
        })
    }

    function toggleSeries(exerciseId, setIndex) {
        updateProgress(exerciseId, (current) => {
            const sets = current.sets.map((checked, currentSetIndex) =>
                currentSetIndex === setIndex ? !checked : checked
            )
            return {
                ...current,
                sets,
                complete: sets.every(Boolean)
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

                return registerExerciseLog(exercise.id, {
                    performed_sets: activityProgress.sets.filter(Boolean).length,
                    performed_reps: String(plannedRepetitions(exercise.target_reps)),
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

    function changeTodayWorkout(event) {
        event.preventDefault()
        const replacement = allWorkouts.find(
            (item) => String(item.id) === replacementId
        )

        if (!replacement) {
            return
        }

        const { presetWorkout } = resolveTodayWorkout(allWorkouts, user?.id)
        if (replacement.id === presetWorkout?.id) {
            clearDailyWorkoutSelection(user?.id)
        } else {
            setDailyWorkoutSelection(user?.id, replacement.id)
        }

        setSwitchOpen(false)
        navigate(`/workouts/${replacement.id}/session?today=1`, {
            replace: true
        })
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
    const otherWorkouts = allWorkouts.filter(
        (item) => String(item.id) !== String(workout.id)
    )
    const {
        presetWorkout,
        isOverride: isTodayOverride
    } = resolveTodayWorkout(allWorkouts, user?.id)
    const currentWeekdayLabel = getWeekdayLabel(getCurrentWeekday())

    return (
        <main className="workout-session-page">
            <div className="session-header">
                <div>
                    <span className="session-label">Treino em andamento</span>
                    <h1>{workout.name}</h1>
                    <p>
                        {isTodaySession
                            ? `${currentWeekdayLabel} · ${isTodayOverride
                                ? 'escolhido apenas para hoje'
                                : 'treino padrão do dia'}`
                            : getWeekdayLabel(workout.weekday)}
                    </p>
                </div>
                <div className="session-actions">
                    {isTodaySession && (
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={() => setSwitchOpen((current) => !current)}
                        >
                            Trocar treino
                        </button>
                    )}
                    <Link className="button-secondary button" to={`/workouts/${workout.id}/edit`}>
                        Configurar treino
                    </Link>
                </div>
            </div>

            {isTodaySession && switchOpen && (
                <section className="workout-switcher" aria-labelledby="workout-switcher-title">
                    <div>
                        <h2 id="workout-switcher-title">Trocar o treino de hoje</h2>
                        <p>
                            A troca vale somente para hoje.{' '}
                            {presetWorkout
                                ? `${presetWorkout.name} continuará como o treino padrão de ${currentWeekdayLabel}.`
                                : 'Os dias padrão dos seus treinos não serão alterados.'}
                        </p>
                    </div>
                    {switchError ? (
                        <p className="form-error">{switchError}</p>
                    ) : otherWorkouts.length ? (
                        <form className="workout-switcher-form" onSubmit={changeTodayWorkout}>
                            <label>
                                Outro treino
                                <select
                                    value={replacementId}
                                    onChange={(event) => setReplacementId(
                                        event.target.value
                                    )}
                                >
                                    {otherWorkouts.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} · {getWeekdayLabel(item.weekday)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit">Usar hoje</button>
                        </form>
                    ) : (
                        <p>Crie outro treino para poder fazer a troca.</p>
                    )}
                </section>
            )}

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

                                        <div className="series-checks" aria-label="Séries realizadas">
                                            {activityProgress.sets.map((checked, setIndex) => (
                                                <label key={setIndex} className="series-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={finished}
                                                        onChange={() => toggleSeries(
                                                            exercise.id,
                                                            setIndex
                                                        )}
                                                    />
                                                    <span>Série {setIndex + 1}</span>
                                                </label>
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
