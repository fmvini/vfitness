import { useEffect, useMemo, useState } from 'react'

import {
    createWorkout,
    deleteWorkout,
    getWorkouts,
    updateWorkout
} from '../api/workoutApi'
import WeekdaySelector from '../components/WeekdaySelector'
import WorkoutCard from '../components/WorkoutCard'
import { findTodayWorkout } from '../utils/weekdayDetector'

export default function DashboardPage() {
    const [workouts, setWorkouts] = useState([])
    const [name, setName] = useState('')
    const [weekday, setWeekday] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const todayWorkout = useMemo(
        () => findTodayWorkout(workouts),
        [workouts]
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
        setWeekday('')
        setEditingId(null)
    }

    function startEditing(workout) {
        setName(workout.name)
        setWeekday(workout.weekday || '')
        setEditingId(workout.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            const payload = { name, weekday: weekday || null }
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
                    <label>
                        Dia da semana
                        <WeekdaySelector value={weekday} onChange={setWeekday} />
                    </label>
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
