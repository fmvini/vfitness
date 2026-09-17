import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }
        try {
            setLoading(true)
            setError('')
            await register(name, email, password, acceptTerms)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Não foi possível criar a conta.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-page register-page">
            <div className="auth-intro">
                <Link to="/login" className="auth-brand" aria-label="VFitness, início">
                    <img src="/vfitness-mark.svg" alt="" />
                    <span>VFitness</span>
                </Link>
                <div>
                    <h2>Um lugar para a sua rotina de treino.</h2>
                    <p>Planeje os dias, registre as sessões e veja sua evolução com clareza.</p>
                </div>
            </div>
            <section className="auth-form-panel" aria-labelledby="register-title">
                <h1 id="register-title">Crie sua conta.</h1>
                <p>Comece organizando seus treinos do seu jeito.</p>
                <form onSubmit={handleSubmit}>
                    <label>
                        Nome
                        <input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label>
                        Email
                        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </label>
                    <label>
                        Senha
                        <input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </label>
                    <label>
                        Confirmar senha
                        <input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                    </label>
                    <label className="terms-check">
                        <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} required />
                        <span>Li e aceito os <Link to="/termos" target="_blank">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.</span>
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
                </form>
                <p className="auth-switch">Já possui conta? <Link to="/login">Entrar</Link></p>
            </section>
        </main>
    )
}
