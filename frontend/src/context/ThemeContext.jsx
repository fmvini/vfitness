import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark'
    })

    useEffect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            theme
        )

        localStorage.setItem('theme', theme)
    }, [theme])

    function toggleTheme() {
        setTheme((currentTheme) =>
            currentTheme === 'dark'
                ? 'light'
                : 'dark'
        )
    }

    const value = {
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
        setTheme
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)

    if (!context) {
        throw new Error(
            'useTheme deve ser utilizado dentro de ThemeProvider'
        )
    }

    return context
}