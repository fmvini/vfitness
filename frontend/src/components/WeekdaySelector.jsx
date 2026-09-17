import { WEEKDAYS } from '../utils/weekdayDetector'

const weekdays = [...WEEKDAYS.slice(1), WEEKDAYS[0]]

export default function WeekdaySelector({ value = [], onChange }) {
    function toggle(day) {
        onChange(value.includes(day)
            ? value.filter((selected) => selected !== day)
            : weekdays.map(({ value: candidate }) => candidate)
                .filter((candidate) => candidate === day || value.includes(candidate)))
    }

    return (
        <fieldset className="weekday-selector">
            <legend>Dias da semana <span>(opcional)</span></legend>
            <div className="weekday-options">
                {weekdays.map((day) => (
                    <label key={day.value} className="weekday-option">
                        <input type="checkbox" checked={value.includes(day.value)} onChange={() => toggle(day.value)} />
                        <span>{day.label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    )
}
