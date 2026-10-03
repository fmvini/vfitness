import assert from 'node:assert/strict'
import test from 'node:test'

import { createDemoData } from '../src/preview/demoData.js'
import { findTodayWorkout, WEEKDAYS } from '../src/utils/weekdayDetector.js'

const NOW = new Date('2026-10-03T15:30:00.000Z')
const DAY_MS = 86_400_000

test('fixtures preserve complete schema fields, unique IDs and ownership', () => {
    const { user, workouts, logs } = createDemoData(NOW)
    const exercises = workouts.flatMap((workout) => workout.exercises)
    const records = [user, ...workouts, ...exercises, ...logs]
    assert.equal(new Set(records.map((record) => record.id)).size, records.length)
    assert.ok(records.every((record) => Number.isSafeInteger(record.id) && record.id > 0))
    assert.equal(user.email, 'preview@example.com')
    assert.equal(user.name, 'Visitante de demonstração')
    assert.deepEqual(Object.keys(user).sort(), ['created_at', 'email', 'id', 'name'])

    const validDays = new Set(WEEKDAYS.map((day) => day.value))
    for (const workout of workouts) {
        assert.equal(workout.user_id, user.id)
        assert.equal(workout.weekday, workout.weekdays[0] ?? null)
        assert.equal(new Set(workout.weekdays).size, workout.weekdays.length)
        assert.ok(workout.weekdays.every((day) => validDays.has(day)))
        assert.ok(workout.exercises.length > 0)
        workout.exercises.forEach((exercise, index) => {
            assert.equal(exercise.workout_id, workout.id)
            assert.equal(exercise.order_index, index)
            assert.ok(['resistance', 'cardio'].includes(exercise.kind))
            assert.equal(typeof exercise.load_per_dumbbell, 'boolean')
            if (exercise.kind === 'cardio') {
                for (const key of ['target_sets', 'target_reps', 'target_load', 'target_rest_seconds']) {
                    assert.equal(exercise[key], null)
                }
                assert.equal(exercise.load_per_dumbbell, false)
                assert.ok(exercise.cardio_duration_minutes > 0)
            } else {
                assert.ok(Number.isInteger(exercise.target_sets) && exercise.target_sets > 0)
                assert.equal(typeof exercise.target_reps, 'string')
                assert.ok(exercise.target_load >= 0)
                assert.ok(Number.isInteger(exercise.target_rest_seconds) && exercise.target_rest_seconds >= 0)
                assert.equal(exercise.cardio_duration_minutes, null)
            }
        })
    }

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const log of logs) {
        const exercise = byId.get(log.exercise_id)
        assert.ok(exercise, 'every log refers to an existing exercise')
        assert.equal(log.user_id, user.id)
        assert.equal(log.load_per_dumbbell, exercise.load_per_dumbbell)
        if (exercise.kind === 'cardio') {
            assert.equal(log.performed_sets, null)
            assert.equal(log.performed_reps, null)
            assert.equal(log.performed_load, null)
            assert.ok(Number.isInteger(log.performed_duration_minutes) && log.performed_duration_minutes > 0)
        } else {
            assert.ok(Number.isInteger(log.performed_sets) && log.performed_sets > 0)
            assert.match(log.performed_reps, /^\d+(\s*,\s*\d+)*$/)
            assert.ok(log.performed_reps.length <= 20)
            assert.ok(log.performed_load >= 0)
            assert.equal(log.performed_duration_minutes, null)
        }
    }
    assert.ok(exercises.some((exercise) => exercise.load_per_dumbbell))
    assert.ok(exercises.some((exercise) => exercise.target_load === 0))
    assert.ok(logs.some((log) => log.performed_reps?.includes(',')))
})

test('today selection follows the actual UI for every weekday and date boundary', () => {
    for (const base of ['2026-10-03T15:30:00Z', '2027-01-01T00:01:00Z', '2028-02-29T23:59:00Z']) {
        for (let offset = 0; offset < 7; offset++) {
            const now = new Date(new Date(base).getTime() + offset * DAY_MS)
            const { workouts } = createDemoData(now)
            assert.equal(findTodayWorkout(workouts, now)?.id, workouts[0].id)
        }
    }
})

test('UTC history populates all stats periods with load and cardio progression', () => {
    const { user, workouts, logs } = createDemoData(NOW)
    for (const value of [user.created_at, ...workouts.map((item) => item.created_at), ...logs.map((log) => log.performed_at)]) {
        assert.equal(new Date(value).toISOString(), value)
        assert.ok(new Date(value) <= NOW)
    }
    for (const days of [7, 30, 365]) {
        const recent = logs.filter((log) => new Date(log.performed_at) >= NOW.getTime() - days * DAY_MS)
        const points = recent.filter((log) => log.exercise_id === workouts[0].exercises[0].id)
        assert.ok(points.length >= 2, 'default resistance chart has multiple points')
        assert.ok(points.at(-1).performed_load > points[0].performed_load)
        assert.ok(new Set(recent.map((log) => log.performed_at.slice(0, 10))).size > 1)
        assert.ok(recent.some((log) => log.performed_load > 0))
        assert.ok(recent.some((log) => log.performed_duration_minutes > 0))
    }
    const todayUTC = NOW.toISOString().slice(0, 10)
    assert.ok(logs.some((log) => log.performed_at.slice(0, 10) === todayUTC && log.performed_load > 0))
    const cardioId = workouts[0].exercises.find((exercise) => exercise.kind === 'cardio').id
    const cardioLogs = logs.filter((log) => log.exercise_id === cardioId)
    assert.ok(cardioLogs.at(-1).performed_duration_minutes > cardioLogs[0].performed_duration_minutes)
})

test('reset returns deterministic deep-independent objects without mutating now', () => {
    const originalTime = NOW.getTime()
    const clean = createDemoData(NOW)
    const edited = createDemoData(NOW)
    assert.deepEqual(edited, clean)
    edited.user.name = 'Alterado'
    edited.workouts[0].weekdays.push('domingo')
    edited.workouts[0].exercises[0].target_load = 999
    edited.workouts.splice(1, 1)
    edited.logs[0].performed_load = 999
    edited.logs.pop()
    assert.deepEqual(createDemoData(NOW), clean)
    assert.equal(NOW.getTime(), originalTime)
    assert.doesNotThrow(() => createDemoData())
})
