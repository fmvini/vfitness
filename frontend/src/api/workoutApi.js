import client, { getCached } from './client.js'
import { isPreviewMode } from '../preview/previewMode.js'
import * as previewApi from '../preview/previewApi.js'

export async function getWorkouts() {
    if (isPreviewMode()) return previewApi.getWorkouts()
    return getCached('/workouts')
}

export async function getWorkoutById(workoutId) {
    if (isPreviewMode()) return previewApi.getWorkoutById(workoutId)
    return getCached(`/workouts/${workoutId}`)
}

export async function createWorkout(workoutData) {
    if (isPreviewMode()) return previewApi.createWorkout(workoutData)
    const response = await client.post('/workouts', workoutData)
    return response.data
}

export async function updateWorkout(workoutId, workoutData) {
    if (isPreviewMode()) return previewApi.updateWorkout(workoutId, workoutData)
    const response = await client.patch(
        `/workouts/${workoutId}`,
        workoutData
    )

    return response.data
}

export async function deleteWorkout(workoutId) {
    if (isPreviewMode()) return previewApi.deleteWorkout(workoutId)
    const response = await client.delete(`/workouts/${workoutId}`)
    return response.data
}

export async function createExercise(workoutId, exerciseData) {
    if (isPreviewMode()) return previewApi.createExercise(workoutId, exerciseData)
    const response = await client.post(
        `/workouts/${workoutId}/exercises`,
        exerciseData
    )

    return response.data
}

export async function updateExercise(exerciseId, exerciseData) {
    if (isPreviewMode()) return previewApi.updateExercise(exerciseId, exerciseData)
    const response = await client.patch(
        `/exercises/${exerciseId}`,
        exerciseData
    )

    return response.data
}

export async function deleteExercise(exerciseId) {
    if (isPreviewMode()) return previewApi.deleteExercise(exerciseId)
    const response = await client.delete(
        `/exercises/${exerciseId}`
    )

    return response.data
}

export async function registerExerciseLog(exerciseId, logData) {
    if (isPreviewMode()) return previewApi.registerExerciseLog(exerciseId, logData)
    const response = await client.post(
        `/exercises/${exerciseId}/logs`,
        logData
    )

    return response.data
}

export async function reorderExercises(workoutId, exercises) {
    if (isPreviewMode()) return previewApi.reorderExercises(workoutId, exercises)
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
    if (isPreviewMode()) return previewApi.getExerciseLogs(exerciseId)
    return getCached(`/exercises/${exerciseId}/logs`)
}
