export const WEEKDAYS = [
    {
        value: 'domingo',
        label: 'Domingo'
    },
    {
        value: 'segunda',
        label: 'Segunda-feira'
    },
    {
        value: 'terca',
        label: 'Terça-feira'
    },
    {
        value: 'quarta',
        label: 'Quarta-feira'
    },
    {
        value: 'quinta',
        label: 'Quinta-feira'
    },
    {
        value: 'sexta',
        label: 'Sexta-feira'
    },
    {
        value: 'sabado',
        label: 'Sábado'
    }
]

export function getCurrentWeekday(date = new Date()) {
    return WEEKDAYS[date.getDay()].value
}

export function getWeekdayLabel(weekday) {
    const day = WEEKDAYS.find(
        (item) => item.value === weekday
    )

    return day?.label || 'Não definido'
}

export function getWeekdays(workout) {
    return Array.isArray(workout?.weekdays)
        ? workout.weekdays
        : workout?.weekday ? [workout.weekday] : []
}

export function getWeekdaysLabel(workout) {
    const days = getWeekdays(workout)
    return days.length ? days.map(getWeekdayLabel).join(' · ') : 'Sem dia definido'
}

export function findTodayWorkout(workouts, date = new Date()) {
    if (!Array.isArray(workouts)) {
        return null
    }

    const currentWeekday = getCurrentWeekday(date)

    return workouts.find(
        (workout) => getWeekdays(workout).includes(currentWeekday)
    ) || null
}

export function hasWorkoutForToday(workouts, date = new Date()) {
    return Boolean(findTodayWorkout(workouts, date))
}
