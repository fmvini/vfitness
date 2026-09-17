import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth()
    if (!isAuthenticated) return null

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo" aria-label="VFitness, início">
                    <img src="/vfitness-mark.svg" alt="" />
                    <span>VFitness</span>
                </Link>
                <nav className="navbar-links" aria-label="Navegação principal">
                    <NavLink end to="/" className={({ isActive }) => isActive ? 'active' : ''}>Meus treinos</NavLink>
                    <NavLink to="/today" className={({ isActive }) => isActive ? 'active' : ''}>Treino do dia</NavLink>
                    <NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>Estatísticas</NavLink>
                </nav>
                <div className="navbar-right">
                    <span className="navbar-user" title={user?.name}>{user?.name}</span>
                    <button type="button" className="logout-button" onClick={logout}>Sair</button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
