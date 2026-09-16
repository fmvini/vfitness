const weekdays = [
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
    },
    {
        value: 'domingo',
        label: 'Domingo'
    }
]

export default function WeekdaySelector({
    value,
    onChange,
    excluded = [],
    label = 'Dia da semana'
}) {
    return (
        <select
            aria-label={label}
            value={value || ''}
            onChange={(e) =>
                onChange(e.target.value)
            }
        >
            <option value="">
                Sem dia definido
            </option>

            {weekdays.map((day) => (
                <option
                    key={day.value}
                    value={day.value}
                    disabled={excluded.includes(day.value)}
                >
                    {day.label}
                </option>
            ))}
        </select>
    )
}
