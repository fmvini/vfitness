import { getCached } from './client'

export async function getDashboardStats() {
    return getCached('/stats/dashboard')
}

export async function getWorkoutFrequency(period = 'week') {
    return getCached(`/stats/frequency?period=${period}`)
}

export async function getTotalWeight(period = 'week') {
    return getCached(`/stats/total-weight?period=${period}`)
}

export async function getExerciseProgress(
    exerciseId,
    period = 'month'
) {
    return getCached(`/stats/exercises/${exerciseId}/progress?period=${period}`)
}

export async function getTopProgressExercises() {
    return getCached('/stats/top-progress')
}
