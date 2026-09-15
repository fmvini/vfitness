import { findTodayWorkout } from './weekdayDetector.js'

export function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function getStorage(storage) {
    if (storage) {
        return storage
    }

    return typeof localStorage === 'undefined' ? null : localStorage
}

function getSelectionKey(userId, date) {
    return `vfitness-today-workout-${userId}-${getLocalDateKey(date)}`
}

export function getDailyWorkoutSelection(userId, date = new Date(), storage) {
    return getStorage(storage)?.getItem(getSelectionKey(userId, date)) || null
}

export function setDailyWorkoutSelection(
    userId,
    workoutId,
    date = new Date(),
    storage
) {
    getStorage(storage)?.setItem(
        getSelectionKey(userId, date),
        String(workoutId)
    )
}

export function clearDailyWorkoutSelection(userId, date = new Date(), storage) {
    getStorage(storage)?.removeItem(getSelectionKey(userId, date))
}

export function resolveTodayWorkout(workouts, userId, date = new Date(), storage) {
    const presetWorkout = findTodayWorkout(workouts, date)
    const selectedId = getDailyWorkoutSelection(userId, date, storage)
    const selectedWorkout = workouts.find(
        (workout) => String(workout.id) === selectedId
    )
    const workout = selectedWorkout || presetWorkout

    return {
        workout,
        presetWorkout,
        isOverride: Boolean(
            selectedWorkout && selectedWorkout.id !== presetWorkout?.id
        )
    }
}
