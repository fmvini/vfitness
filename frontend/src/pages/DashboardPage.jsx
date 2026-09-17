import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { createWorkout, deleteWorkout, getWorkouts, updateWorkout } from '../api/workoutApi'
import WeekdaySelector from '../components/WeekdaySelector'
import WorkoutCard from '../components/WorkoutCard'
import { useAuth } from '../context/AuthContext'
import { resolveTodayWorkout } from '../utils/dailyWorkoutSelection'
import { getWeekdays, getWeekdaysLabel } from '../utils/weekdayDetector'

const weekdayOrder = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']

export default function DashboardPage() {
    const { user } = useAuth()
    const [workouts, setWorkouts] = useState([])
    const [name, setName] = useState('')
    const [weekdays, setWeekdays] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [loadError, setLoadError] = useState('')

    const { workout: todayWorkout, isOverride: isTodayOverride } = useMemo(
        () => resolveTodayWorkout(workouts, user?.id),
        [user?.id, workouts]
    )

    useEffect(() => { loadWorkouts() }, [])

    async function loadWorkouts() {
        try {
            setLoadError('')
            setWorkouts(await getWorkouts())
        } catch (err) {
            setLoadError(err.response?.data?.detail || 'Não foi possível carregar os treinos.')
        } finally {
            setLoading(false)
        }
    }

    function retryLoad() {
        setLoading(true)
        loadWorkouts()
    }

    function resetForm() {
        setName('')
        setWeekdays([])
        setEditingId(null)
    }

    function startEditing(workout) {
        setName(workout.name)
        setWeekdays(getWeekdays(workout))
        setEditingId(workout.id)
        document.getElementById('novo-treino')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        try {
            setSaving(true)
            setError('')
            const payload = { name, weekdays }
            if (editingId) await updateWorkout(editingId, payload)
            else await createWorkout(payload)
            resetForm()
            await loadWorkouts()
        } catch (err) {
            setError(err.response?.data?.detail || 'Não foi possível salvar o treino.')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(workoutId) {
        try {
            setError('')
            await deleteWorkout(workoutId)
            if (editingId === workoutId) resetForm()
            await loadWorkouts()
        } catch (err) {
            setError(err.response?.data?.detail || 'Não foi possível remover o treino.')
        }
    }

    return (
        <main className="dashboard-page">
            <div className="dashboard-intro">
                <div>
                    <h1>Meus treinos</h1>
                    <p>Uma rotina que cabe no seu dia.</p>
                </div>
                <span className="intro-date">
                    {new Intl.DateTimeFormat('pt-BR', {
                        weekday: 'long', day: 'numeric', month: 'long'
                    }).format(new Date())}
                </span>
            </div>

            <div className="dashboard-feature-grid">
                <section className="today-feature" aria-labelledby="today-feature-title">
                    <div className="today-feature-copy">
                        <span className="feature-label">Treino de hoje</span>
                        <h2 id="today-feature-title">
                            {loading ? 'Preparando seu dia...' : loadError ? 'Não foi possível carregar seus treinos.' : todayWorkout?.name || 'Seu dia, seu ritmo.'}
                        </h2>
                        <p>
                            {loadError ? 'Verifique a conexão e tente novamente.' : todayWorkout
                                ? `${getWeekdaysLabel(todayWorkout)}${isTodayOverride ? ' · escolhido para hoje' : ''}`
                                : 'Escolha um treino para hoje ou organize o próximo dia da sua semana.'}
                        </p>
                        <div className="today-feature-actions">
                            {loadError ? (
                                <button type="button" onClick={retryLoad}>Tentar novamente</button>
                            ) : todayWorkout ? (
                                <>
                                    <Link className="button" to="/today">Iniciar treino</Link>
                                    <Link className="button button-secondary" to={`/workouts/${todayWorkout.id}/edit`}>Ver atividades</Link>
                                </>
                            ) : workouts.length ? (
                                <Link className="button" to="/today">Escolher treino para hoje</Link>
                            ) : (
                                <a className="button" href="#novo-treino">Criar primeiro treino</a>
                            )}
                        </div>
                    </div>
                    <div className="today-feature-visual" aria-hidden="true">
                        <img className="today-feature-art today-feature-art-light" src="/studio-equipment.png" alt="" loading="lazy" decoding="async" />
                        <img className="today-feature-art today-feature-art-dark" src="/studio-equipment-dark.png" alt="" loading="lazy" decoding="async" />
                    </div>
                </section>

                <section className="editor-section dashboard-editor" id="novo-treino" aria-labelledby="editor-title">
                    <div className="editor-heading">
                        <span className="editor-symbol" aria-hidden="true" />
                        <div>
                            <h2 id="editor-title">{editingId ? 'Editar treino' : 'Novo treino'}</h2>
                            <p>{editingId ? 'Ajuste o nome ou os dias da semana.' : 'Dê um nome e escolha os dias de treino.'}</p>
                        </div>
                    </div>
                    <form className="workout-form" onSubmit={handleSubmit}>
                        <label>
                            Nome do treino
                            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Peito e tríceps" required />
                        </label>
                        <WeekdaySelector value={weekdays} onChange={setWeekdays} />
                        <div className="form-actions">
                            <button type="submit" disabled={saving}>
                                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar treino'}
                            </button>
                            {editingId && <button type="button" className="button-secondary" onClick={resetForm}>Cancelar</button>}
                        </div>
                    </form>
                    {error && <p className="form-error" role="alert">{error}</p>}
                </section>
            </div>

            {loading ? (
                <p className="loading-note">Carregando treinos...</p>
            ) : loadError ? (
                <p className="form-error" role="alert">{loadError}</p>
            ) : workouts.length === 0 ? (
                <div className="empty-state">
                    <h2>Nenhum treino cadastrado</h2>
                    <p>Use o formulário acima para criar seu primeiro treino.</p>
                </div>
            ) : (
                <section className="workouts-section" aria-labelledby="workouts-heading">
                    <div className="section-heading">
                        <div>
                            <h2 id="workouts-heading">Sua semana</h2>
                            <p>Seus treinos, no ritmo que você definiu.</p>
                        </div>
                        <span>{workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}</span>
                    </div>
                    <div className="workout-list">
                        {workouts.slice().sort((a, b) => {
                            const dayA = Math.min(7, ...getWeekdays(a).map((day) => weekdayOrder.indexOf(day)))
                            const dayB = Math.min(7, ...getWeekdays(b).map((day) => weekdayOrder.indexOf(day)))
                            return (dayA < 0 ? 7 : dayA) - (dayB < 0 ? 7 : dayB)
                        }).map((workout) => (
                            <WorkoutCard
                                key={workout.id}
                                workout={workout}
                                isToday={workout.id === todayWorkout?.id}
                                isTodayOverride={isTodayOverride && workout.id === todayWorkout?.id}
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
