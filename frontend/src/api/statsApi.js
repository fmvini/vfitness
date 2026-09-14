import client from './client'

export async function getDashboardStats() {
    const response = await client.get('/stats/dashboard')
    return response.data
}

export async function getWorkoutFrequency(period = 'week') {
    const response = await client.get(
        `/stats/frequency?period=${period}`
    )

    return response.data
}

export async function getTotalWeight(period = 'week') {
    const response = await client.get(
        `/stats/total-weight?period=${period}`
    )

    return response.data
}

export async function getExerciseProgress(
    exerciseId,
    period = 'month'
) {
    const response = await client.get(
        `/stats/exercises/${exerciseId}/progress?period=${period}`
    )

    return response.data
}

export async function getTopProgressExercises() {
    const response = await client.get(
        '/stats/top-progress'
    )

    return response.data
}
