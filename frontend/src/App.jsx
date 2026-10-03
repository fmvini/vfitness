import { lazy, Suspense, useEffect, useState } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
    useNavigate
} from 'react-router-dom'

import { AuthProvider, PreviewAuthProvider, useAuth } from './context/AuthContext'
import { isPreviewMode } from './preview/previewMode.js'
import { resetPreview } from './preview/previewApi.js'
import { resetPreviewUi } from './utils/previewUiStorage.js'

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

function RouteAuthProvider({ children }) {
    // React to SPA route changes and unmount real auth before entering preview.
    useLocation()
    const Provider = isPreviewMode() ? PreviewAuthProvider : AuthProvider
    return <Provider>{children}</Provider>
}

function AppContent() {
    const preview = isPreviewMode()
    const navigate = useNavigate()
    const [previewVersion, setPreviewVersion] = useState(0)

    function restartPreview() {
        resetPreview()
        resetPreviewUi()
        setPreviewVersion((version) => version + 1)
        navigate('/preview', { replace: true })
    }

    return (
        <>
            <ScrollToTop />
            <Navbar />
            {preview && (
                <aside className="preview-banner" aria-label="Modo demonstração">
                    <div>
                        <strong>Demonstração com dados fictícios</strong>
                        <p>Explore todas as funções sem login. As alterações ficam apenas nesta demonstração e são descartadas ao recarregar a página.</p>
                        <span className="preview-reset-status" role="status">
                            {previewVersion > 0 ? 'Demonstração restaurada aos dados iniciais.' : ''}
                        </span>
                    </div>
                    <button type="button" className="button-secondary" onClick={restartPreview}>Reiniciar demonstração</button>
                </aside>
            )}

            <Suspense fallback={<main className="route-loading">Carregando página...</main>}>
            <Routes key={preview ? `preview-${previewVersion}` : 'application'}>
                <Route path="/preview" element={<DashboardPage />} />
                <Route path="/preview/today" element={<TodayWorkoutPage />} />
                <Route path="/preview/workouts/:id/edit" element={<WorkoutDetailPage />} />
                <Route path="/preview/workouts/:id/session" element={<WorkoutSessionPage />} />
                <Route path="/preview/stats" element={<StatsPage />} />
                <Route path="/preview/privacidade" element={<PrivacyPage />} />
                <Route path="/preview/termos" element={<TermsPage />} />
                <Route path="/preview/*" element={<NotFoundPage />} />
                <Route path="/privacidade" element={<PrivacyPage />} />
                <Route path="/termos" element={<TermsPage />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/workouts/:id/edit" element={<ProtectedRoute><WorkoutDetailPage /></ProtectedRoute>} />
                <Route path="/workouts/:id/session" element={<ProtectedRoute><WorkoutSessionPage /></ProtectedRoute>} />
                <Route path="/today" element={<ProtectedRoute><TodayWorkoutPage /></ProtectedRoute>} />
                <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
            <SiteFooter />
            <CookieBanner />
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <RouteAuthProvider>
                <AppContent />
            </RouteAuthProvider>
        </BrowserRouter>
    )
}
