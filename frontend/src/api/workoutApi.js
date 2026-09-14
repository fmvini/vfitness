import client from './client'

export async function getWorkouts() {
    const response = await client.get('/workouts')
    return response.data
}

export async function getWorkoutById(workoutId) {
    const response = await client.get(`/workouts/${workoutId}`)
    return response.data
}

export async function createWorkout(workoutData) {
    const response = await client.post('/workouts', workoutData)
    return response.data
}

export async function updateWorkout(workoutId, workoutData) {
    const response = await client.patch(
        `/workouts/${workoutId}`,
        workoutData
    )

    return response.data
}

export async function deleteWorkout(workoutId) {
    const response = await client.delete(`/workouts/${workoutId}`)
    return response.data
}

export async function createExercise(workoutId, exerciseData) {
    const response = await client.post(
        `/workouts/${workoutId}/exercises`,
        exerciseData
    )

    return response.data
}

export async function updateExercise(exerciseId, exerciseData) {
    const response = await client.patch(
        `/exercises/${exerciseId}`,
        exerciseData
    )

    return response.data
}

export async function deleteExercise(exerciseId) {
    const response = await client.delete(
        `/exercises/${exerciseId}`
    )

    return response.data
}

export async function registerExerciseLog(exerciseId, logData) {
    const response = await client.post(
        `/exercises/${exerciseId}/logs`,
        logData
    )

    return response.data
}

export async function reorderExercises(workoutId, exercises) {
    const response = await client.patch(
        `/workouts/${workoutId}/exercises/reorder`,
        exercises.map((exercise, index) => ({
            exercise_id: exercise.id,
            order_index: index
        }))
    )

    return response.data
}

export async function getExerciseLogs(exerciseId) {
    const response = await client.get(
        `/exercises/${exerciseId}/logs`
    )

    return response.data
}
