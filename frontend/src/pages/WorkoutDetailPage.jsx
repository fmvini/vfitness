import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
    createExercise,
    deleteExercise,
    getWorkoutById,
    reorderExercises,
    updateExercise
} from '../api/workoutApi'
import ExerciseForm from '../components/ExerciseForm'
import ExerciseItem from '../components/ExerciseItem'
import { getWeekdayLabel } from '../utils/weekdayDetector'

export default function WorkoutDetailPage() {
    const { id } = useParams()
    const [workout, setWorkout] = useState(null)
    const [editingExercise, setEditingExercise] = useState(null)
    const [exerciseFormVersion, setExerciseFormVersion] = useState(0)
    const [draggedId, setDraggedId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        loadWorkout()
    }, [id])

    async function loadWorkout() {
        try {
            setError('')
            setWorkout(await getWorkoutById(id))
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível carregar o treino.'
            )
        } finally {
            setLoading(false)
        }
    }

    async function saveExercise(data) {
        try {
            setError('')
            setMessage('')
            if (editingExercise) {
                await updateExercise(editingExercise.id, data)
                setEditingExercise(null)
            } else {
                await createExercise(id, data)
                setExerciseFormVersion((current) => current + 1)
            }
            await loadWorkout()
            setMessage('Configuração salva.')
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível salvar a atividade.'
            )
        }
    }

    async function removeExercise(exerciseId) {
        try {
            setError('')
            await deleteExercise(exerciseId)
            await loadWorkout()
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível remover a atividade.'
            )
        }
    }

    async function saveOrder(nextExercises) {
        const previousExercises = workout.exercises
        setWorkout({ ...workout, exercises: nextExercises })
        try {
            const saved = await reorderExercises(id, nextExercises)
            setWorkout((current) => ({ ...current, exercises: saved }))
            setMessage('Ordem dos exercícios atualizada.')
            setError('')
        } catch (err) {
            setWorkout({ ...workout, exercises: previousExercises })
            setError('Não foi possível atualizar a ordem dos exercícios.')
        }
    }

    function moveExercise(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= workout.exercises.length) {
            return
        }
        const nextExercises = [...workout.exercises]
        const [moved] = nextExercises.splice(fromIndex, 1)
        nextExercises.splice(toIndex, 0, moved)
        saveOrder(nextExercises)
    }

    function handleDrop(targetId) {
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null)
            return
        }
        const fromIndex = workout.exercises.findIndex((item) => item.id === draggedId)
        const toIndex = workout.exercises.findIndex((item) => item.id === targetId)
        moveExercise(fromIndex, toIndex)
        setDraggedId(null)
    }

    if (loading) {
        return <main className="workout-detail-page"><p>Carregando treino...</p></main>
    }

    if (!workout) {
        return (
            <main className="workout-detail-page">
                <p>{error || 'Treino não encontrado.'}</p>
                <Link className="text-link" to="/">Voltar aos treinos</Link>
            </main>
        )
    }

    return (
        <main className="workout-detail-page">
            <Link className="text-link back-link" to="/">Voltar aos treinos</Link>
            <div className="page-heading">
                <div>
                    <h1>Configurar {workout.name}</h1>
                    <p>{getWeekdayLabel(workout.weekday)}</p>
                </div>
                <Link className="button" to={`/workouts/${workout.id}/session`}>
                    Iniciar treino
                </Link>
            </div>

            <section className="editor-section">
                <h2>{editingExercise ? 'Editar atividade' : 'Adicionar atividade'}</h2>
                <ExerciseForm
                    key={editingExercise?.id || `new-${exerciseFormVersion}`}
                    initialData={editingExercise}
                    onSubmit={saveExercise}
                />
                {editingExercise && (
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => setEditingExercise(null)}
                    >
                        Cancelar edição
                    </button>
                )}
            </section>

            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}

            <section className="exercise-section">
                <div className="section-heading">
                    <div>
                        <h2>Ordem do treino</h2>
                        <p>Arraste uma atividade para mudar sua posição.</p>
                    </div>
                </div>
                {!workout.exercises?.length ? (
                    <div className="empty-state">
                        <p>Nenhuma atividade cadastrada neste treino.</p>
                    </div>
                ) : workout.exercises.map((exercise, index) => (
                    <div
                        key={exercise.id}
                        className={`exercise-block draggable-exercise${draggedId === exercise.id ? ' dragging' : ''}`}
                        draggable
                        onDragStart={() => setDraggedId(exercise.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(exercise.id)}
                        onDragEnd={() => setDraggedId(null)}
                    >
                        <ExerciseItem
                            exercise={exercise}
                            onEdit={setEditingExercise}
                            onDelete={removeExercise}
                            onMoveUp={() => moveExercise(index, index - 1)}
                            onMoveDown={() => moveExercise(index, index + 1)}
                            isFirst={index === 0}
                            isLast={index === workout.exercises.length - 1}
                        />
                    </div>
                ))}
            </section>
        </main>
    )
}
