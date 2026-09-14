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

            await register(name, email, password)

            navigate('/login')
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Não foi possível criar a conta.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <h1>Criar conta</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

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

                <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar conta'}
                </button>
            </form>

            <p>
                Já possui conta?{' '}
                <Link to="/login">
                    Entrar
                </Link>
            </p>
        </div>
    )
}