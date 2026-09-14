import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts'

export default function ProgressChart({
    data = [],
    title = 'Evolução de Carga'
}) {
    if (!data.length) {
        return (
            <div className="chart-empty">
                Nenhum dado disponível.
            </div>
        )
    }

    return (
        <div className="progress-chart">
            <h3>{title}</h3>

            <ResponsiveContainer
                width="100%"
                height={350}
            >
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="recorded_at" />

                    <YAxis />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="load_kg"
                        stroke="#2563eb"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
