import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

import ThemeToggle from './ThemeToggle'

export default function Navbar() {
    const {
        user,
        isAuthenticated,
        logout
    } = useAuth()

    if (!isAuthenticated) {
        return null
    }

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <Link
                    to="/"
                    className="navbar-logo"
                >
                    <img src="/vfitness-mark.png" alt="" />
                    <span>VFitness</span>
                </Link>

                <Link to="/">
                    Dashboard
                </Link>

                <Link to="/today">
                    Treino do dia
                </Link>

                <Link to="/stats">
                    Estatísticas
                </Link>
            </div>

            <div className="navbar-right">
                <span className="navbar-user">
                    {user?.name}
                </span>

                <ThemeToggle />

                <button
                    type="button"
                    onClick={logout}
                >
                    Sair
                </button>
            </div>
        </nav>
    )
}
