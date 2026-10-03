import { getCurrentWeekday, WEEKDAYS } from '../utils/weekdayDetector.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** Pure, synthetic browser fixtures. Every call builds a fresh reset state. */
export function createDemoData(now = new Date()) {
    const timestamp = now.getTime()
    const daysAgo = (days) => new Date(timestamp - days * DAY_MS).toISOString()
    // High, globally distinct IDs also keep preview session keys separate.
    let nextId = 9_000_001
    const user = {
        id: nextId++,
        name: 'Visitante de demonstração',
        email: 'preview@example.com',
        created_at: daysAgo(100)
    }
    const dayAt = (offset) => WEEKDAYS[(now.getDay() + offset) % 7].value

    function resistance(name, sets, reps, load, rest, perDumbbell = false) {
        return {
            name,
            kind: 'resistance',
            target_sets: sets,
            target_reps: reps,
            target_load: load,
            load_per_dumbbell: perDumbbell,
            target_rest_seconds: rest,
            cardio_duration_minutes: null
        }
    }

    function cardio(name, minutes) {
        return {
            name,
            kind: 'cardio',
            target_sets: null,
            target_reps: null,
            target_load: null,
            load_per_dumbbell: false,
            target_rest_seconds: null,
            cardio_duration_minutes: minutes
        }
    }

    function workout(name, weekdays, exercises) {
        const id = nextId++
        return {
            id,
            user_id: user.id,
            name,
            weekday: weekdays[0] ?? null,
            weekdays,
            created_at: daysAgo(90),
            exercises: exercises.map((exercise, order_index) => ({
                ...exercise,
                id: nextId++,
                workout_id: id,
                order_index
            }))
        }
    }

    const workouts = [
        workout('Treino A — Peito e tríceps', [getCurrentWeekday(now), dayAt(3)], [
            resistance('Supino reto com barra', 4, '8-10', 40, 90),
            resistance('Supino inclinado com halteres', 3, '10-12', 14, 75, true),
            resistance('Tríceps na polia', 3, '12', 20, 60),
            cardio('Caminhada na esteira', 15)
        ]),
        workout('Treino B — Costas e bíceps', [dayAt(1), dayAt(4)], [
            resistance('Puxada frontal', 4, '10-12', 35, 90),
            resistance('Remada com halteres', 3, '10', 16, 75, true),
            resistance('Rosca alternada', 3, '10-12', 8, 60, true),
            cardio('Bicicleta ergométrica', 20)
        ]),
        workout('Treino C — Pernas e abdômen', [dayAt(2), dayAt(5)], [
            resistance('Agachamento livre', 4, '8-10', 45, 120),
            resistance('Leg press', 3, '12', 100, 90),
            resistance('Abdominal no solo', 3, '15', 0, 45),
            cardio('Elíptico', 12)
        ]),
        workout('Cardio leve — Dia flexível', [], [
            cardio('Caminhada ao ar livre', 30),
            cardio('Bicicleta leve', 15)
        ])
    ]

    // Session dates cover the week/month/year filters. The first exercise has
    // several recent points so the initially selected chart already shows progress.
    const sessionDays = [
        [84, 56, 42, 28, 21, 14, 10, 6, 3, 0],
        [82, 54, 40, 26, 19, 12, 5, 1],
        [80, 52, 38, 24, 17, 10, 4, 2],
        [23, 16, 9]
    ]
    const logs = workouts.flatMap((item, workoutIndex) =>
        sessionDays[workoutIndex].flatMap((days, sessionIndex, sessions) => {
            const progression = sessionIndex / (sessions.length - 1)
            return item.exercises.map((exercise) => {
                const isCardio = exercise.kind === 'cardio'
                const reps = Number(exercise.target_reps?.match(/\d+/)?.[0])
                return {
                    id: nextId++,
                    exercise_id: exercise.id,
                    user_id: user.id,
                    performed_at: daysAgo(days),
                    performed_sets: isCardio ? null : exercise.target_sets,
                    // Include both supported repetition formats, including varying sets.
                    performed_reps: isCardio ? null : sessionIndex % 2 === 0
                        ? Array.from({ length: exercise.target_sets }, (_, index) =>
                            Math.max(1, reps - (index === exercise.target_sets - 1 ? 1 : 0))
                        ).join(',')
                        : String(reps),
                    performed_load: isCardio ? null :
                        Math.round(exercise.target_load * (0.65 + 0.35 * progression) * 2) / 2,
                    performed_duration_minutes: isCardio ?
                        Math.max(1, exercise.cardio_duration_minutes - Math.round(5 * (1 - progression)))
                        : null,
                    load_per_dumbbell: exercise.load_per_dumbbell
                }
            })
        })
    ).sort((a, b) => a.performed_at.localeCompare(b.performed_at) || a.id - b.id)

    return { user, workouts, logs }
}
