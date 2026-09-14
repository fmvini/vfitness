import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
    const {
        theme,
        toggleTheme
    } = useTheme()

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
        >
            {theme === 'dark'
                ? 'Modo claro'
                : 'Modo escuro'}
        </button>
    )
}