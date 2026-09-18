import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { GOOGLE_CLIENT_ID } from '../config/google'

function getLoginError(error, fallback) {
    if (!error.response) return 'Não foi possível conectar ao serviço. Tente novamente.'
    return error.response.data?.detail || fallback
}

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, loginWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [acceptGoogleTerms, setAcceptGoogleTerms] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        try {
            setLoading(true)
            setError('')
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(getLoginError(err, 'Email ou senha inválidos.'))
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleLogin(credential) {
        try {
            setLoading(true)
            setError('')
            await loginWithGoogle(credential, acceptGoogleTerms)
            navigate('/')
        } catch (err) {
            setError(getLoginError(err, 'Não foi possível entrar com o Google.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-page login-page">
            <div className="auth-intro">
                <Link to="/login" className="auth-brand" aria-label="VFitness, início">
                    <img src="/vfitness-mark.svg" alt="" />
                    <span>VFitness</span>
                </Link>
                <div>
                    <h2>O treino começa no seu ritmo.</h2>
                    <p>Organize sua semana, registre cada sessão e acompanhe o que mudou.</p>
                </div>
            </div>
            <section className="auth-form-panel" aria-labelledby="login-title">
                <h1 id="login-title">Bom ter você de volta.</h1>
                <p>Entre para continuar de onde parou.</p>
                <form onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </label>
                    <label>
                        Senha
                        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                </form>
                {GOOGLE_CLIENT_ID && <div className="google-terms">
                    <label className="terms-check">
                        <input type="checkbox" checked={acceptGoogleTerms} onChange={(event) => setAcceptGoogleTerms(event.target.checked)} />
                        <span>Para entrar com Google, li e aceito os <Link to="/termos" target="_blank">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.</span>
                    </label>
                    <GoogleLoginButton onCredential={handleGoogleLogin} disabled={loading || !acceptGoogleTerms} />
                </div>}
                <p className="auth-switch">Ainda não tem conta? <Link to="/register">Criar conta</Link></p>
            </section>
        </main>
    )
}
