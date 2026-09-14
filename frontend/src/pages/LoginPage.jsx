import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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
            setError(
                err.response?.data?.detail ||
                'Email ou senha inválidos.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <h1>Entrar</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>

            <p>
                Não possui conta?{' '}
                <Link to="/register">
                    Criar conta
                </Link>
            </p>
        </div>
    )
}