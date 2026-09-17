import { lazy, Suspense, useEffect } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom'

import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import SiteFooter from './components/SiteFooter'
import CookieBanner from './components/CookieBanner'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const WorkoutDetailPage = lazy(() => import('./pages/WorkoutDetailPage'))
const WorkoutSessionPage = lazy(() => import('./pages/WorkoutSessionPage'))
const TodayWorkoutPage = lazy(() => import('./pages/TodayWorkoutPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

function ConnectionUnavailable({ onRetry }) {
    return (
        <main className="connection-page">
            <h1>Não foi possível conectar ao VFitness.</h1>
            <p>A API está indisponível no momento. Sua sessão foi preservada.</p>
            <button type="button" onClick={onRetry}>Tentar novamente</button>
        </main>
    )
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading, connectionError, retryConnection } = useAuth()

    if (loading) {
        return <div>Carregando...</div>
    }

    if (connectionError) {
        return <ConnectionUnavailable onRetry={retryConnection} />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading, connectionError, retryConnection } = useAuth()

    if (loading) {
        return <div>Carregando...</div>
    }

    if (connectionError) {
        return <ConnectionUnavailable onRetry={retryConnection} />
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
            <ScrollToTop />
            <Navbar />

            <Suspense fallback={<main className="route-loading">Carregando página...</main>}>
            <Routes>
                <Route path="/privacidade" element={<PrivacyPage />} />
                <Route path="/termos" element={<TermsPage />} />
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
                    element={<NotFoundPage />}
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
                    element={<NotFoundPage />}
                />
            </Routes>
            </Suspense>
            <SiteFooter />
            <CookieBanner />
        </BrowserRouter>
    )
}
