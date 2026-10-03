import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { after, afterEach, beforeEach, mock, test } from 'node:test'
import { createDemoData } from '../src/preview/demoData.js'
import * as preview from '../src/preview/previewApi.js'
import { isPreviewMode } from '../src/preview/previewMode.js'

// Stub only the HTTP boundary; import and execute the real public API modules.
// Any accidental client/cache call in preview is recorded and fails the test.
const calls = []
globalThis.__previewHttpCall = (method, ...args) => {
    calls.push({ method, args })
    return Promise.resolve({ data: { real: true } })
}
const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === './client.js' && /\/api\/(workoutApi|statsApi)\.js$/.test(context.parentURL || '')) {
            return { url: 'preview-test:client', shortCircuit: true }
        }
        return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
        if (url === 'preview-test:client') {
            return {
                format: 'module', shortCircuit: true,
                source: `
                    export const getCached = (...args) => globalThis.__previewHttpCall('cache', ...args).then(r => r.data);
                    export default Object.fromEntries(['post', 'patch', 'delete'].map(method => [method,
                        (...args) => globalThis.__previewHttpCall(method, ...args)]));
                `
            }
        }
        return nextLoad(url, context)
    }
})
const workoutApi = await import('../src/api/workoutApi.js')
const statsApi = await import('../src/api/statsApi.js')
const now = new Date('2026-10-03T12:00:00.000Z')
const originalWindow = globalThis.window
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
const originalFetch = globalThis.fetch
const realUserStorage = new Map([
    ['token', 'real-user-token'], ['user', '{"id":123,"name":"Real user"}'],
    ['vfitness-session-1-2026-10-03', '{"finished":true}']
])
const storageSnapshot = [...realUserStorage]
const forbiddenStorage = {
    getItem() { assert.fail('Preview must not read real storage') },
    setItem() { assert.fail('Preview must not write real storage') },
    removeItem() { assert.fail('Preview must not remove real storage') },
    clear() { assert.fail('Preview must not clear real storage') }
}

beforeEach(() => {
    mock.timers.enable({ apis: ['Date'], now: now.getTime() })
    globalThis.window = { location: { pathname: '/preview' } }
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: forbiddenStorage })
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: forbiddenStorage })
    globalThis.fetch = () => assert.fail('Preview must not send HTTP requests')
    calls.length = 0
    preview.resetPreview()
})

afterEach(() => {
    mock.timers.reset()
    assert.deepEqual([...realUserStorage], storageSnapshot)
})

after(() => {
    hooks.deregister()
    delete globalThis.__previewHttpCall
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
    for (const [key, descriptor] of [['localStorage', originalStorage], ['sessionStorage', originalSessionStorage]]) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
    }
    globalThis.fetch = originalFetch
})

const resistance = {
    name: 'Halteres', kind: 'resistance', target_sets: 3, target_reps: '8-12',
    target_load: 12, target_rest_seconds: 60, load_per_dumbbell: true
}

async function emptyPreview() {
    for (const workout of await preview.getWorkouts()) await preview.deleteWorkout(workout.id)
}

async function newExercise(fields = resistance) {
    const workout = await preview.createWorkout({ name: 'Teste', weekdays: ['segunda', 'quarta'] })
    const exercise = await preview.createExercise(workout.id, fields)
    return { workout, exercise }
}

const status = (expected) => (error) => {
    assert.equal(error.response.status, expected)
    assert.equal(typeof error.response.data.detail, 'string')
    return true
}

test('preview mode uses an exact path boundary and is safe without a browser', () => {
    for (const path of ['/preview', '/preview/', '/preview/workouts/1/edit', '/preview/stats']) {
        window.location.pathname = path
        assert.equal(isPreviewMode(), true, path)
    }
    for (const path of ['/', '/workouts', '/preview-other', '/previews', '/foo/preview', '/PREVIEW']) {
        window.location.pathname = path
        assert.equal(isPreviewMode(), false, path)
    }
    delete globalThis.window
    assert.equal(isPreviewMode(), false)
})

test('fixture bootstrap, detached responses, global IDs and synchronous reset', async () => {
    const fixture = createDemoData(now)
    const user = preview.getPreviewUser()
    assert.deepEqual(user, fixture.user)
    user.name = 'Changed externally'
    assert.deepEqual(preview.getPreviewUser(), fixture.user)
    const listed = await preview.getWorkouts()
    assert.equal(listed.length, fixture.workouts.length)
    assert.ok(listed.every((workout) => !Object.hasOwn(workout, 'exercises')))
    const detail = await preview.getWorkoutById(String(listed[0].id))
    const initialDetail = structuredClone(detail)
    detail.name = 'Changed externally'
    detail.exercises.pop()
    assert.deepEqual(await preview.getWorkoutById(detail.id), initialDetail)
    const knownIds = [fixture.user.id, ...fixture.workouts.map(w => w.id),
        ...fixture.workouts.flatMap(w => w.exercises.map(e => e.id)), ...fixture.logs.map(l => l.id)]
    const created = await preview.createWorkout({ name: 'Novo' })
    assert.ok(created.id > Math.max(...knownIds))
    const resetResult = preview.resetPreview()
    assert.equal(typeof resetResult?.then, 'undefined')
    assert.deepEqual(resetResult, fixture.user)
    assert.deepEqual(await preview.getWorkoutById(initialDetail.id), initialDetail)
    assert.deepEqual(createDemoData(now), fixture)
})

test('workout CRUD respects weekday precedence, ordering and validation', async () => {
    await emptyPreview()
    const first = await preview.createWorkout({ name: 'A', weekday: 'segunda', weekdays: [] })
    assert.equal(first.weekday, 'segunda')
    assert.deepEqual(first.weekdays, ['segunda'])
    mock.timers.tick(1000)
    const second = await preview.createWorkout({ name: 'B', weekday: 'sexta', weekdays: ['terca', 'quinta'] })
    assert.equal(second.weekday, 'terca')
    assert.deepEqual((await preview.getWorkouts()).map(w => w.id), [second.id, first.id])
    const updated = await preview.updateWorkout(String(first.id), { name: 'Atualizado', weekdays: ['quarta', 'sabado'] })
    assert.equal(updated.name, 'Atualizado')
    assert.equal(updated.weekday, 'quarta')
    assert.equal((await preview.updateWorkout(first.id, { weekday: 'domingo' })).weekday, 'domingo')
    assert.deepEqual((await preview.updateWorkout(first.id, { weekdays: null })).weekdays, [])
    assert.equal((await preview.getWorkoutById(first.id)).weekday, null)
    for (const fields of [{ name: null }, { weekdays: ['terca', 'terca'] }, { weekdays: ['monday'] }]) {
        await assert.rejects(preview.updateWorkout(first.id, fields), status(422))
    }
    assert.equal(await preview.deleteWorkout(first.id), '')
    await assert.rejects(preview.getWorkoutById(first.id), status(404))
    assert.equal((await preview.getWorkouts()).length, 1)
})

test('exercise CRUD normalizes cardio/resistance and orders atomically', async () => {
    await emptyPreview()
    const { workout, exercise } = await newExercise()
    assert.equal(exercise.order_index, 1)
    assert.equal(exercise.workout_id, workout.id)
    const cardio = await preview.createExercise(workout.id, {
        name: 'Esteira', kind: 'cardio', cardio_duration_minutes: 20,
        target_sets: 3, target_reps: '10', target_load: 5, target_rest_seconds: 60, load_per_dumbbell: true
    })
    assert.equal(cardio.order_index, 2)
    assert.equal(cardio.target_sets, null)
    assert.equal(cardio.target_reps, null)
    assert.equal(cardio.target_load, null)
    assert.equal(cardio.target_rest_seconds, null)
    assert.equal(cardio.load_per_dumbbell, false)
    const updated = await preview.updateExercise(exercise.id, {
        name: 'Supino', target_load: 15, order_index: 99, id: 99999, workout_id: 99999
    })
    assert.equal(updated.id, exercise.id)
    assert.equal(updated.workout_id, workout.id)
    assert.equal(updated.order_index, 1)
    assert.equal(updated.target_load, 15)
    const ordered = await preview.reorderExercises(workout.id, [cardio, exercise])
    assert.deepEqual(ordered.map(e => e.id), [cardio.id, exercise.id])
    assert.deepEqual(ordered.map(e => e.order_index), [0, 1])
    const { exercise: foreign } = await newExercise()
    await assert.rejects(preview.reorderExercises(workout.id, [exercise, exercise]), status(400))
    await assert.rejects(preview.reorderExercises(workout.id, [exercise, foreign]), status(400))
    assert.deepEqual((await preview.getWorkoutById(workout.id)).exercises, ordered)
    for (const fields of [{ target_sets: null }, { target_rest_seconds: null }, { target_load: -1 }, { name: '' }]) {
        await assert.rejects(preview.updateExercise(exercise.id, fields), status(422))
    }
    await assert.rejects(preview.createExercise(workout.id, { name: 'Cardio', kind: 'cardio' }), status(422))
    await preview.deleteExercise(cardio.id)
    await assert.rejects(preview.updateExercise(cardio.id, { name: 'Ausente' }), status(404))
    assert.deepEqual((await preview.getWorkoutById(workout.id)).exercises.map(e => e.id), [exercise.id])
})

test('logs preserve dates, inherit halter semantics, validate and cascade on deletion', async () => {
    await emptyPreview()
    const { workout, exercise } = await newExercise()
    const log = await preview.registerExerciseLog(String(exercise.id), {
        performed_sets: 3, performed_reps: '10,9,8', performed_load: 12,
        performed_at: '2026-10-01T09:00:00-03:00', load_per_dumbbell: false,
        user_id: 999, exercise_id: 999
    })
    assert.equal(log.exercise_id, exercise.id)
    assert.equal(log.user_id, preview.getPreviewUser().id)
    assert.equal(log.load_per_dumbbell, true)
    assert.equal(log.performed_at, '2026-10-01T12:00:00.000Z')
    assert.equal(log.performed_duration_minutes, null)
    const recent = await preview.registerExerciseLog(exercise.id, {
        performed_sets: 3, performed_reps: '10', performed_load: 14
    })
    assert.equal(recent.performed_at, now.toISOString())
    assert.deepEqual((await preview.getExerciseLogs(exercise.id)).map(l => l.id), [recent.id, log.id])
    for (const fields of [
        {}, { performed_sets: 0, performed_reps: '10', performed_load: 12 },
        { performed_sets: 3, performed_reps: '8-12', performed_load: 12 },
        { performed_sets: 3, performed_reps: '10', performed_load: -1 },
        { performed_sets: 3, performed_reps: '10', performed_load: 12, performed_at: 'invalid' }
    ]) await assert.rejects(preview.registerExerciseLog(exercise.id, fields), status(422))
    const cardio = await preview.createExercise(workout.id, { name: 'Bike', kind: 'cardio', cardio_duration_minutes: 20 })
    await assert.rejects(preview.registerExerciseLog(cardio.id, {}), status(422))
    const cardioLog = await preview.registerExerciseLog(cardio.id, {
        performed_duration_minutes: 18, performed_sets: 3, performed_reps: '10', performed_load: 12
    })
    assert.equal(cardioLog.performed_sets, null)
    assert.equal(cardioLog.performed_reps, null)
    assert.equal(cardioLog.performed_load, null)
    assert.equal(cardioLog.load_per_dumbbell, false)
    await preview.deleteExercise(exercise.id)
    await assert.rejects(preview.getExerciseLogs(exercise.id), status(404))
    assert.equal((await preview.getTotalWeight('year')).total_weight_kg, 0)
    assert.equal((await preview.getWorkoutFrequency()).days_trained, 1)
    await preview.deleteWorkout(workout.id)
    assert.equal((await preview.getWorkoutFrequency()).days_trained, 0)
    assert.deepEqual(await preview.getDashboardStats(), { total_workouts: 0, total_exercises: 0, active_exercises: 0 })
})

test('all stats follow UTC windows, unique dates, reps, cardio and load progression', async () => {
    await emptyPreview()
    const { workout, exercise } = await newExercise()
    const cardio = await preview.createExercise(workout.id, { name: 'Bike', kind: 'cardio', cardio_duration_minutes: 20 })
    const entries = [
        ['2026-10-03T10:00:00Z', '10', 12],       // 720 today
        ['2026-10-02T10:00:00Z', '10,9,8', 10],  // 540 this week
        ['2026-09-20T10:00:00Z', '10', 8],        // 480 this month
        ['2026-08-01T10:00:00Z', '10', 6],        // 360 this year
        ['2025-09-01T10:00:00Z', '10', 4],        // outside year
        ['2026-10-04T10:00:00Z', '10', 50]        // future excluded
    ]
    for (const [performed_at, performed_reps, performed_load] of entries) {
        await preview.registerExerciseLog(exercise.id, { performed_at, performed_reps, performed_load, performed_sets: 3 })
    }
    await preview.registerExerciseLog(cardio.id, { performed_at: '2026-10-02T22:00:00Z', performed_duration_minutes: 18 })
    // Converted to UTC, this cardio counts as a third distinct date within week.
    await preview.registerExerciseLog(cardio.id, { performed_at: '2026-10-01T23:30:00+03:00', performed_duration_minutes: 18 })
    assert.deepEqual(await preview.getDashboardStats(), { total_workouts: 1, total_exercises: 2, active_exercises: 2 })
    for (const [period, weight] of [['day', 720], ['week', 1260], ['month', 1740], ['year', 2100]]) {
        assert.deepEqual(await preview.getTotalWeight(period), { period, total_weight_kg: weight })
    }
    for (const [period, count, days] of [['week', 3, 7], ['month', 4, 30], ['year', 5, 365]]) {
        assert.deepEqual(await preview.getWorkoutFrequency(period), { period, days_trained: count, days_in_period: days })
    }
    assert.deepEqual(await preview.getExerciseProgress(exercise.id), {
        exercise_id: exercise.id, exercise_name: exercise.name, period: 'month',
        points: [
            { recorded_at: '2026-09-20', load_kg: 8 },
            { recorded_at: '2026-10-02', load_kg: 10 },
            { recorded_at: '2026-10-03', load_kg: 12 }
        ]
    })
    assert.deepEqual((await preview.getExerciseProgress(cardio.id)).points, [])
    assert.deepEqual(await preview.getTopProgressExercises(), [{
        exercise_id: exercise.id, exercise_name: exercise.name, progress_kg: 4
    }])
    await assert.rejects(preview.getExerciseProgress(999999), status(404))
    await assert.rejects(preview.getTotalWeight('invalid'), status(422))
    await assert.rejects(preview.getWorkoutFrequency('day'), status(422))
    await assert.rejects(preview.getExerciseProgress(exercise.id, 'day'), status(422))
})

test('period edges include the start/end, and day starts at UTC midnight', async () => {
    await emptyPreview()
    const { exercise } = await newExercise({ ...resistance, load_per_dumbbell: false })
    const base = { performed_sets: 1, performed_reps: '1', performed_load: 10 }
    for (const date of ['2026-09-26T11:59:59.999Z', '2026-09-26T12:00:00Z',
        '2026-10-02T23:59:59.999Z', '2026-10-03T00:00:00Z',
        '2026-10-03T12:00:00Z', '2026-10-03T12:00:00.001Z']) {
        await preview.registerExerciseLog(exercise.id, { ...base, performed_at: date })
    }
    assert.equal((await preview.getTotalWeight('day')).total_weight_kg, 20)
    assert.equal((await preview.getTotalWeight('week')).total_weight_kg, 40)
    assert.equal((await preview.getWorkoutFrequency('week')).days_trained, 3)
})

test('top progress sorts by gain, includes regressions, and limits to five', async () => {
    await emptyPreview()
    const workout = await preview.createWorkout({ name: 'Ranking' })
    const exercises = []
    for (const gain of [2, -1, 8, 3, 0, 5, -3]) {
        const exercise = await preview.createExercise(workout.id, { ...resistance, name: `Ganho ${gain}` })
        exercises.push(exercise)
        await preview.registerExerciseLog(exercise.id, { performed_sets: 1, performed_reps: '1', performed_load: 10,
            performed_at: '2026-10-01T10:00:00Z' })
        await preview.registerExerciseLog(exercise.id, { performed_sets: 1, performed_reps: '1', performed_load: 10 + gain,
            performed_at: '2026-10-02T10:00:00Z' })
    }
    assert.deepEqual((await preview.getTopProgressExercises()).map(e => e.progress_kg), [8, 5, 3, 2, 0])
    for (const exercise of exercises.filter(e => !['Ganho -1', 'Ganho -3'].includes(e.name))) {
        await preview.deleteExercise(exercise.id)
    }
    assert.deepEqual((await preview.getTopProgressExercises()).map(e => e.progress_kg), [-1, -3])
})

test('every public workout/stats operation stays local with real storage present', async () => {
    window.location.pathname = '/preview/workouts/new'
    const initial = await workoutApi.getWorkouts()
    await workoutApi.getWorkoutById(initial[0].id)
    const workout = await workoutApi.createWorkout({ name: 'Local' })
    await workoutApi.updateWorkout(workout.id, { name: 'Local editado' })
    const exercise = await workoutApi.createExercise(workout.id, resistance)
    await workoutApi.updateExercise(exercise.id, { target_load: 14 })
    await workoutApi.reorderExercises(workout.id, [exercise])
    await workoutApi.registerExerciseLog(exercise.id, { performed_sets: 3, performed_reps: '10', performed_load: 14 })
    assert.equal((await workoutApi.getExerciseLogs(exercise.id)).length, 1)
    await statsApi.getDashboardStats()
    await statsApi.getWorkoutFrequency()
    await statsApi.getTotalWeight()
    await statsApi.getExerciseProgress(exercise.id)
    await statsApi.getTopProgressExercises()
    await workoutApi.deleteExercise(exercise.id)
    await workoutApi.deleteWorkout(workout.id)
    preview.getPreviewUser()
    preview.resetPreview()
    assert.deepEqual(calls, [])
})

test('outside preview every API retains its HTTP path, payload and response', async () => {
    window.location.pathname = '/workouts'
    const payload = { name: 'Real' }
    const cases = [
        [workoutApi.getWorkouts, [], 'cache', ['/workouts']],
        [workoutApi.getWorkoutById, [7], 'cache', ['/workouts/7']],
        [workoutApi.createWorkout, [payload], 'post', ['/workouts', payload]],
        [workoutApi.updateWorkout, [7, payload], 'patch', ['/workouts/7', payload]],
        [workoutApi.deleteWorkout, [7], 'delete', ['/workouts/7']],
        [workoutApi.createExercise, [7, payload], 'post', ['/workouts/7/exercises', payload]],
        [workoutApi.updateExercise, [9, payload], 'patch', ['/exercises/9', payload]],
        [workoutApi.deleteExercise, [9], 'delete', ['/exercises/9']],
        [workoutApi.registerExerciseLog, [9, payload], 'post', ['/exercises/9/logs', payload]],
        [workoutApi.getExerciseLogs, [9], 'cache', ['/exercises/9/logs']],
        [workoutApi.reorderExercises, [7, [{ id: 9 }, { id: 8 }]], 'patch',
            ['/workouts/7/exercises/reorder', [{ exercise_id: 9, order_index: 0 }, { exercise_id: 8, order_index: 1 }]]],
        [statsApi.getDashboardStats, [], 'cache', ['/stats/dashboard']],
        [statsApi.getWorkoutFrequency, [], 'cache', ['/stats/frequency?period=week']],
        [statsApi.getTotalWeight, ['year'], 'cache', ['/stats/total-weight?period=year']],
        [statsApi.getExerciseProgress, [9], 'cache', ['/stats/exercises/9/progress?period=month']],
        [statsApi.getTopProgressExercises, [], 'cache', ['/stats/top-progress']]
    ]
    assert.equal(cases.length, Object.keys(workoutApi).length + Object.keys(statsApi).length)
    for (const [operation, args, method, httpArgs] of cases) {
        calls.length = 0
        assert.deepEqual(await operation(...args), { real: true }, operation.name)
        assert.deepEqual(calls, [{ method, args: httpArgs }], operation.name)
    }
})
