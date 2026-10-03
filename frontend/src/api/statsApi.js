import { getCached } from './client.js'
import { isPreviewMode } from '../preview/previewMode.js'
import * as previewApi from '../preview/previewApi.js'

export async function getDashboardStats() {
    if (isPreviewMode()) return previewApi.getDashboardStats()
    return getCached('/stats/dashboard')
}

export async function getWorkoutFrequency(period = 'week') {
    if (isPreviewMode()) return previewApi.getWorkoutFrequency(period)
    return getCached(`/stats/frequency?period=${period}`)
}

export async function getTotalWeight(period = 'week') {
    if (isPreviewMode()) return previewApi.getTotalWeight(period)
    return getCached(`/stats/total-weight?period=${period}`)
}

export async function getExerciseProgress(
    exerciseId,
    period = 'month'
) {
    if (isPreviewMode()) return previewApi.getExerciseProgress(exerciseId, period)
    return getCached(`/stats/exercises/${exerciseId}/progress?period=${period}`)
}

export async function getTopProgressExercises() {
    if (isPreviewMode()) return previewApi.getTopProgressExercises()
    return getCached('/stats/top-progress')
}
