import test from 'node:test'
import assert from 'node:assert/strict'
import { isPreviewMode } from '../src/preview/previewMode.js'
import { routePath } from '../src/utils/routePath.js'
import { previewUiStorage, resetPreviewUi } from '../src/utils/previewUiStorage.js'
import {
    getDailyWorkoutSelection,
    setDailyWorkoutSelection,
    clearDailyWorkoutSelection
} from '../src/utils/dailyWorkoutSelection.js'

test('preview paths preserve query strings and normal navigation', () => {
    globalThis.window = { location: { pathname: '/preview' } }
    assert.equal(isPreviewMode(), true)
    assert.equal(routePath('/'), '/preview')
    assert.equal(routePath('/workouts/12/session?today=1'), '/preview/workouts/12/session?today=1')
    assert.equal(routePath('/preview/stats'), '/preview/stats')
    window.location.pathname = '/preview/stats'
    assert.equal(isPreviewMode(), true)
    window.location.pathname = '/preview-other'
    assert.equal(isPreviewMode(), false)
    assert.equal(routePath('/stats'), '/stats')
    delete globalThis.window
    assert.equal(isPreviewMode(), false)
})

test('preview selection and session reset leave real storage untouched', () => {
    const values = new Map()
    const storage = {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    }
    const date = new Date(2026, 9, 3, 12)
    globalThis.window = { location: { pathname: '/today' } }
    setDailyWorkoutSelection(42, 100, date, storage)
    storage.setItem('token', 'existing-account-token')
    storage.setItem('vfitness-session-100-2026-10-03', 'real-progress')
    const original = [...values]

    window.location.pathname = '/preview/today'
    resetPreviewUi()
    assert.equal(getDailyWorkoutSelection(42, date, storage), null)
    setDailyWorkoutSelection(42, 200, date, storage)
    assert.equal(getDailyWorkoutSelection(42, date, storage), '200')
    clearDailyWorkoutSelection(42, date, storage)
    assert.equal(getDailyWorkoutSelection(42, date, storage), null)
    setDailyWorkoutSelection(42, 300, date, storage)
    previewUiStorage.setItem('preview-session', 'demo-progress')
    resetPreviewUi()
    assert.equal(getDailyWorkoutSelection(42, date, storage), null)
    assert.equal(previewUiStorage.getItem('preview-session'), null)
    assert.deepEqual([...values], original)

    window.location.pathname = '/today'
    assert.equal(getDailyWorkoutSelection(42, date, storage), '100')
    delete globalThis.window
})
