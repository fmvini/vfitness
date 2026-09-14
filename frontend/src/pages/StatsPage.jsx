import { useEffect, useState } from 'react'

import {
    getDashboardStats,
    getWorkoutFrequency,
    getTotalWeight
} from '../api/statsApi'

export default function StatsPage() {
    const [stats, setStats] = useState(null)
    const [frequency, setFrequency] = useState(null)
    const [totalWeight, setTotalWeight] = useState(null)

    useEffect(() => {
        loadStats()
    }, [])

    async function loadStats() {
        try {
            const [
                dashboardData,
                frequencyData,
                weightData
            ] = await Promise.all([
                getDashboardStats(),
                getWorkoutFrequency(),
                getTotalWeight()
            ])

            setStats(dashboardData)
            setFrequency(frequencyData)
            setTotalWeight(weightData)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="stats-page">
            <h1>Estatísticas</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Peso Total</h3>
                    <p>
                        {totalWeight?.total_weight ?? 0} kg
                    </p>
                </div>

                <div className="stat-card">
                    <h3>Treinos Realizados</h3>
                    <p>
                        {frequency?.trained_days ?? 0}
                    </p>
                </div>

                <div className="stat-card">
                    <h3>Exercícios Ativos</h3>
                    <p>
                        {stats?.active_exercises ?? 0}
                    </p>
                </div>
            </div>

            <div className="stats-section">
                <h2>Resumo</h2>

                <p>
                    Treinos cadastrados:{' '}
                    {stats?.total_workouts ?? 0}
                </p>

                <p>
                    Exercícios cadastrados:{' '}
                    {stats?.total_exercises ?? 0}
                </p>
            </div>
        </div>
    )
}