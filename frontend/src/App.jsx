import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import WorkoutSessionPage from './pages/WorkoutSessionPage'
import TodayWorkoutPage from './pages/TodayWorkoutPage'
import StatsPage from './pages/StatsPage'

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return <div>Carregando...</div>
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return <div>Carregando...</div>
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return children
}

export default function App() {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <Navbar />

            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workouts/:id/edit"
                    element={
                        <ProtectedRoute>
                            <WorkoutDetailPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workouts/:id/session"
                    element={
                        <ProtectedRoute>
                            <WorkoutSessionPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/today"
                    element={
                        <ProtectedRoute>
                            <TodayWorkoutPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/workouts/:id"
                    element={<Navigate to="/" replace />}
                />

                <Route
                    path="/stats"
                    element={
                        <ProtectedRoute>
                            <StatsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    )
}
