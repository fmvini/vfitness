import { useEffect, useMemo, useState } from 'react'

import {
    createWorkout,
    deleteWorkout,
    getWorkouts,
    updateWorkout
} from '../api/workoutApi'
import WeekdaySelector from '../components/WeekdaySelector'
import WorkoutCard from '../components/WorkoutCard'
import { useAuth } from '../context/AuthContext'
import { resolveTodayWorkout } from '../utils/dailyWorkoutSelection'
import { WEEKDAYS, getWorkoutWeekdays } from '../utils/weekdayDetector'

export default function DashboardPage() {
    const { user } = useAuth()
    const [workouts, setWorkouts] = useState([])
    const [name, setName] = useState('')
    const [weekdays, setWeekdays] = useState([''])
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const { workout: todayWorkout, isOverride: isTodayOverride } = useMemo(
        () => resolveTodayWorkout(workouts, user?.id),
        [user?.id, workouts]
    )

    useEffect(() => {
        loadWorkouts()
    }, [])

    async function loadWorkouts() {
        try {
            setError('')
            setWorkouts(await getWorkouts())
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível carregar os treinos.'
            )
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setName('')
        setWeekdays([''])
        setEditingId(null)
    }

    function startEditing(workout) {
        setName(workout.name)
        const days = getWorkoutWeekdays(workout)
        setWeekdays(days.length ? days : [''])
        setEditingId(workout.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            const payload = { name, weekdays: weekdays.filter(Boolean) }
            if (editingId) {
                await updateWorkout(editingId, payload)
            } else {
                await createWorkout(payload)
            }
            resetForm()
            await loadWorkouts()
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível salvar o treino.'
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(workoutId) {
        try {
            setError('')
            await deleteWorkout(workoutId)
            if (editingId === workoutId) {
                resetForm()
            }
            await loadWorkouts()
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível remover o treino.'
            )
        }
    }

    return (
        <main className="dashboard-page">
            <div className="page-heading">
                <div>
                    <h1>Meus treinos</h1>
                    <p>Organize seus treinos por dia da semana.</p>
                </div>
            </div>

            <section className="editor-section">
                <h2>{editingId ? 'Editar treino' : 'Novo treino'}</h2>
                <form className="workout-form" onSubmit={handleSubmit}>
                    <label>
                        Nome
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Exemplo: Peito e tríceps"
                            required
                        />
                    </label>
                    <div className="workout-days">
                        <span>Dias da semana</span>
                        {weekdays.map((day, index) => (
                            <div className="workout-day-row" key={index}>
                                <WeekdaySelector
                                    value={day}
                                    label={`Dia da semana ${index + 1}`}
                                    excluded={weekdays.filter((_, position) => position !== index)}
                                    onChange={(value) => setWeekdays((current) =>
                                        current.map((item, position) => position === index ? value : item)
                                    )}
                                />
                                {weekdays.length > 1 && (
                                    <button
                                        type="button"
                                        className="button-secondary"
                                        aria-label={`Remover dia ${index + 1}`}
                                        onClick={() => setWeekdays((current) => current.filter((_, position) => position !== index))}
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        ))}
                        {weekdays.length < WEEKDAYS.length && (
                            <button
                                type="button"
                                className="button-secondary add-day-button"
                                onClick={() => setWeekdays((current) => [...current, ''])}
                            >
                                Adicionar dia
                            </button>
                        )}
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar treino'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={resetForm}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
                {error && <p className="form-error">{error}</p>}
            </section>

            {loading ? (
                <p>Carregando treinos...</p>
            ) : workouts.length === 0 ? (
                <div className="empty-state">
                    <h2>Nenhum treino cadastrado</h2>
                    <p>Use o formulário acima para criar seu primeiro treino.</p>
                </div>
            ) : (
                <section>
                    <h2>
                        {todayWorkout ? 'Treino de hoje e demais treinos' : 'Todos os treinos'}
                    </h2>
                    <div className="workout-list">
                        {workouts
                            .slice()
                            .sort((a, b) =>
                                Number(b.id === todayWorkout?.id) -
                                Number(a.id === todayWorkout?.id)
                            )
                            .map((workout) => (
                                <WorkoutCard
                                    key={workout.id}
                                    workout={workout}
                                    isToday={workout.id === todayWorkout?.id}
                                    isTodayOverride={
                                        isTodayOverride && workout.id === todayWorkout?.id
                                    }
                                    onEdit={startEditing}
                                    onDelete={handleDelete}
                                />
                            ))}
                    </div>
                </section>
            )}
        </main>
    )
}
