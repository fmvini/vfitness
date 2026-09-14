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
    onChange
}) {
    return (
        <select
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
                >
                    {day.label}
                </option>
            ))}
        </select>
    )
}