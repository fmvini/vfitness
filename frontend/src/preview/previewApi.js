import { createDemoData } from './demoData.js'

// This state belongs exclusively to this browser tab. No auth or storage access.
let state
let nextId
const DAY_MS = 24 * 60 * 60 * 1000
const weekdays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
const exerciseFields = [
    'name', 'kind', 'target_sets', 'target_reps', 'target_load',
    'load_per_dumbbell', 'target_rest_seconds', 'cardio_duration_minutes', 'order_index'
]

function clone(value) {
    return structuredClone(value)
}

function data() {
    if (!state) resetPreview()
    return state
}

export function resetPreview() {
    state = clone(createDemoData())
    nextId = Math.max(
        0, state.user.id,
        ...state.workouts.map((workout) => workout.id),
        ...state.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.id)),
        ...state.logs.map((log) => log.id)
    ) + 1
    return clone(state.user)
}

export function getPreviewUser() {
    return clone(data().user)
}

function fail(status, detail) {
    const error = new Error(detail)
    error.response = { status, data: { detail } }
    throw error
}

function check(condition, detail) {
    if (!condition) fail(422, detail)
}

function workoutFor(id) {
    const workout = data().workouts.find((item) => String(item.id) === String(id))
    if (!workout) fail(404, 'Treino nao encontrado.')
    return workout
}

function exerciseFor(id) {
    const exercise = data().workouts.flatMap((workout) => workout.exercises)
        .find((item) => String(item.id) === String(id))
    if (!exercise) fail(404, 'Exercicio nao encontrado.')
    return exercise
}

function validString(value, maxLength, label) {
    check(typeof value === 'string' && value.length > 0 && value.length <= maxLength, label)
    return value
}

function number(value, minimum, integer, label) {
    check(value !== null && value !== undefined && value !== '' && typeof value !== 'boolean', label)
    const result = Number(value)
    check(Number.isFinite(result) && result >= minimum && (!integer || Number.isInteger(result)), label)
    return result
}

function optionalNumber(value, minimum, integer, label) {
    return value == null ? null : number(value, minimum, integer, label)
}

function workoutFields(input, creating = false) {
    const fields = {}
    if (creating || Object.hasOwn(input, 'name')) {
        fields.name = validString(input.name, 120, 'Informe o nome do treino (ate 120 caracteres).')
    }
    if (Object.hasOwn(input, 'weekday')) {
        check(input.weekday == null || weekdays.includes(input.weekday), 'Dia da semana invalido.')
    }
    if (Object.hasOwn(input, 'weekdays') && input.weekdays != null) {
        check(Array.isArray(input.weekdays) && input.weekdays.length <= 7
            && input.weekdays.every((day) => weekdays.includes(day)), 'Dias da semana invalidos.')
        check(new Set(input.weekdays).size === input.weekdays.length,
            'Selecione cada dia da semana apenas uma vez.')
    }
    if (creating) {
        check(input.weekdays !== null, 'Dias da semana invalidos.')
        fields.weekdays = input.weekdays?.length ? [...input.weekdays]
            : input.weekday ? [input.weekday] : []
    } else if (Object.hasOwn(input, 'weekdays')) {
        fields.weekdays = [...(input.weekdays || [])]
    } else if (Object.hasOwn(input, 'weekday')) {
        fields.weekdays = input.weekday ? [input.weekday] : []
    }
    if (fields.weekdays) fields.weekday = fields.weekdays[0] || null
    return fields
}

function normalizeExercise(input) {
    const exercise = {
        name: validString(input.name, 120, 'Informe o nome do exercicio (ate 120 caracteres).'),
        kind: input.kind === undefined ? 'resistance' : input.kind,
        target_sets: optionalNumber(input.target_sets, 1, true, 'Informe series validas.'),
        target_reps: input.target_reps == null ? null
            : validString(input.target_reps, 20, 'Informe repeticoes validas.'),
        target_load: optionalNumber(input.target_load, 0, false, 'Informe uma carga valida.'),
        load_per_dumbbell: input.load_per_dumbbell === undefined ? false : input.load_per_dumbbell,
        target_rest_seconds: optionalNumber(input.target_rest_seconds, 0, true, 'Informe um descanso valido.'),
        cardio_duration_minutes: optionalNumber(input.cardio_duration_minutes, 1, true, 'Informe o tempo do cardio em minutos.'),
        order_index: optionalNumber(input.order_index, 0, true, 'Posicao do exercicio invalida.')
    }
    check(['resistance', 'cardio'].includes(exercise.kind), 'Tipo de exercicio invalido.')
    check(typeof exercise.load_per_dumbbell === 'boolean', 'Informe se a carga e por halter.')
    if (exercise.kind === 'cardio') {
        check(exercise.cardio_duration_minutes !== null, 'Informe o tempo do cardio em minutos.')
        Object.assign(exercise, {
            target_sets: null, target_reps: null, target_load: null,
            load_per_dumbbell: false, target_rest_seconds: null
        })
    } else {
        check(exercise.target_sets !== null && exercise.target_reps !== null,
            'Informe series e repeticoes do exercicio.')
        check(exercise.target_rest_seconds !== null, 'Informe o tempo de descanso do exercicio.')
        exercise.cardio_duration_minutes = null
    }
    return exercise
}

function workoutRead(workout) {
    const { exercises, ...read } = workout
    return clone(read)
}

function sortedExercises(workout) {
    return [...workout.exercises].sort((a, b) => a.order_index - b.order_index)
}

export async function getWorkouts() {
    return [...data().workouts].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .map(workoutRead)
}

export async function getWorkoutById(workoutId) {
    const workout = workoutFor(workoutId)
    return clone({ ...workout, exercises: sortedExercises(workout) })
}

export async function createWorkout(workoutData) {
    const fields = workoutFields(workoutData, true)
    const previewState = data()
    const workout = {
        ...fields, id: nextId++, user_id: previewState.user.id,
        created_at: new Date().toISOString(), exercises: []
    }
    previewState.workouts.push(workout)
    return workoutRead(workout)
}

export async function updateWorkout(workoutId, workoutData) {
    const workout = workoutFor(workoutId)
    Object.assign(workout, workoutFields(workoutData))
    return workoutRead(workout)
}

export async function deleteWorkout(workoutId) {
    const workout = workoutFor(workoutId)
    const ids = new Set(workout.exercises.map((exercise) => exercise.id))
    state.logs = state.logs.filter((log) => !ids.has(log.exercise_id))
    state.workouts = state.workouts.filter((item) => item.id !== workout.id)
    return ''
}

export async function createExercise(workoutId, exerciseData) {
    const workout = workoutFor(workoutId)
    const fields = normalizeExercise(exerciseData)
    if (fields.order_index === null) {
        fields.order_index = Math.max(0, ...workout.exercises.map((exercise) => exercise.order_index)) + 1
    }
    const exercise = { ...fields, id: nextId++, workout_id: workout.id }
    workout.exercises.push(exercise)
    return clone(exercise)
}

export async function updateExercise(exerciseId, exerciseData) {
    const exercise = exerciseFor(exerciseId)
    const changes = Object.fromEntries(exerciseFields.filter((field) => Object.hasOwn(exerciseData, field))
        .map((field) => [field, exerciseData[field]]))
    const { order_index, ...fields } = normalizeExercise({ ...exercise, ...changes })
    // Like the backend, positions are changed only through reorderExercises.
    Object.assign(exercise, fields)
    return clone(exercise)
}

export async function deleteExercise(exerciseId) {
    const exercise = exerciseFor(exerciseId)
    const workout = workoutFor(exercise.workout_id)
    workout.exercises = workout.exercises.filter((item) => item.id !== exercise.id)
    state.logs = state.logs.filter((log) => log.exercise_id !== exercise.id)
    return ''
}

export async function reorderExercises(workoutId, exercises) {
    const workout = workoutFor(workoutId)
    check(Array.isArray(exercises), 'Lista de exercicios invalida.')
    const ids = exercises.map((exercise) => String(exercise.id))
    if (new Set(ids).size !== ids.length) {
        fail(400, 'A lista de reordenacao contem exercicios duplicados.')
    }
    const reordered = ids.map((id) => workout.exercises.find((exercise) => String(exercise.id) === id))
    if (reordered.some((exercise) => !exercise)) {
        fail(400, 'Um ou mais exercicios nao pertencem a este treino.')
    }
    reordered.forEach((exercise, index) => { exercise.order_index = index })
    return clone(sortedExercises(workout))
}

export async function registerExerciseLog(exerciseId, logData) {
    const exercise = exerciseFor(exerciseId)
    const fields = {
        performed_sets: optionalNumber(logData.performed_sets, 1, true, 'Informe series validas.'),
        performed_reps: logData.performed_reps == null ? null
            : validString(logData.performed_reps, 20, 'Informe repeticoes validas.'),
        performed_load: optionalNumber(logData.performed_load, 0, false, 'Informe uma carga valida.'),
        performed_duration_minutes: optionalNumber(logData.performed_duration_minutes, 1, true, 'Informe o tempo realizado do cardio.')
    }
    if (fields.performed_reps !== null) {
        check(/^\d+(\s*,\s*\d+)*$/.test(fields.performed_reps), 'Informe repeticoes validas.')
    }
    const performedAt = logData.performed_at == null ? new Date() : new Date(logData.performed_at)
    check(Number.isFinite(performedAt.getTime()), 'Data de execucao invalida.')
    if (exercise.kind === 'cardio') {
        check(fields.performed_duration_minutes !== null, 'Informe o tempo realizado do cardio.')
        Object.assign(fields, { performed_sets: null, performed_reps: null, performed_load: null })
    } else {
        check(fields.performed_sets !== null && fields.performed_reps !== null && fields.performed_load !== null,
            'Informe series, repeticoes e carga realizadas.')
    }
    const log = {
        ...fields, id: nextId++, exercise_id: exercise.id, user_id: data().user.id,
        load_per_dumbbell: exercise.kind === 'cardio' ? false : exercise.load_per_dumbbell,
        performed_at: performedAt.toISOString()
    }
    state.logs.push(log)
    return clone(log)
}

export async function getExerciseLogs(exerciseId) {
    const exercise = exerciseFor(exerciseId)
    return clone(data().logs.filter((log) => log.exercise_id === exercise.id)
        .sort((a, b) => Date.parse(b.performed_at) - Date.parse(a.performed_at)))
}

function periodWindow(period, allowDay = false) {
    const days = { week: 7, month: 30, year: 365 }
    check(Object.hasOwn(days, period) || (allowDay && period === 'day'), 'Periodo invalido.')
    // Seed before taking the window's end so today's initial logs are included.
    data()
    const end = new Date()
    const start = period === 'day'
        ? Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
        : end.getTime() - days[period] * DAY_MS
    return { start, end: end.getTime(), days: days[period] || 1 }
}

function logsInWindow(window) {
    return data().logs.filter((log) => {
        const timestamp = Date.parse(log.performed_at)
        return timestamp >= window.start && timestamp <= window.end
    })
}

function roundWeight(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

export async function getDashboardStats() {
    const total = data().workouts.reduce((count, workout) => count + workout.exercises.length, 0)
    return { total_workouts: state.workouts.length, total_exercises: total, active_exercises: total }
}

export async function getWorkoutFrequency(period = 'week') {
    const window = periodWindow(period)
    const dates = new Set(logsInWindow(window).map((log) => new Date(log.performed_at).toISOString().slice(0, 10)))
    return { period, days_trained: dates.size, days_in_period: window.days }
}

export async function getTotalWeight(period = 'week') {
    const logs = logsInWindow(periodWindow(period, true))
    const total = logs.reduce((weight, log) => {
        if (log.performed_load == null || log.performed_reps == null || log.performed_sets == null) return weight
        const parts = String(log.performed_reps).split(',').map((part) => part.trim())
        const reps = parts.every((part) => /^[-+]?\d+$/.test(part))
            ? parts.length === 1 ? Number(parts[0]) * log.performed_sets
                : parts.reduce((sum, part) => sum + Number(part), 0)
            : 0
        return weight + log.performed_load * reps * (log.load_per_dumbbell ? 2 : 1)
    }, 0)
    return { period, total_weight_kg: roundWeight(total) }
}

export async function getExerciseProgress(exerciseId, period = 'month') {
    const exercise = exerciseFor(exerciseId)
    const logs = logsInWindow(periodWindow(period))
        .filter((log) => log.exercise_id === exercise.id && log.performed_load != null)
        .sort((a, b) => Date.parse(a.performed_at) - Date.parse(b.performed_at))
    return {
        exercise_id: exercise.id, exercise_name: exercise.name, period,
        points: logs.map((log) => ({
            recorded_at: new Date(log.performed_at).toISOString().slice(0, 10),
            load_kg: Number(log.performed_load)
        }))
    }
}

export async function getTopProgressExercises() {
    const grouped = new Map()
    const logs = logsInWindow(periodWindow('month')).filter((log) => log.performed_load != null)
        .sort((a, b) => a.exercise_id - b.exercise_id || Date.parse(a.performed_at) - Date.parse(b.performed_at))
    for (const log of logs) {
        if (!grouped.has(log.exercise_id)) grouped.set(log.exercise_id, [])
        grouped.get(log.exercise_id).push(log)
    }
    return [...grouped.entries()].filter(([, logs]) => logs.length >= 2)
        .map(([id, logs]) => ({
            exercise_id: id, exercise_name: exerciseFor(id).name,
            progress_kg: roundWeight(logs.at(-1).performed_load - logs[0].performed_load)
        }))
        .sort((a, b) => b.progress_kg - a.progress_kg).slice(0, 5)
}
