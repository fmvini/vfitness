import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react'

import {
    login as loginRequest,
    register as registerRequest,
    loginWithGoogle as googleLoginRequest,
    logout as logoutRequest,
    getCurrentUser
} from '../api/authApi'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const isAuthenticated = !!user

    useEffect(() => {
        initializeAuth()
    }, [])

    async function initializeAuth() {
        const token = localStorage.getItem('token')

        if (!token) {
            setLoading(false)
            return
        }

        try {
            const userData = await getCurrentUser()
            setUser(userData)
        } catch (error) {
            localStorage.removeItem('token')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    async function login(email, password) {
        const response = await loginRequest({
            email,
            password
        })

        const userData = await getCurrentUser()

        setUser(userData)

        return response
    }

    async function register(name, email, password) {
        const response = await registerRequest({
            name,
            email,
            password
        })

        const userData = await getCurrentUser()
        setUser(userData)
        return response
    }

    async function loginWithGoogle(credential) {
        const response = await googleLoginRequest(credential)
        const userData = await getCurrentUser()
        setUser(userData)
        return response
    }

    function logout() {
        logoutRequest()
        setUser(null)
    }

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        loginWithGoogle,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            'useAuth deve ser utilizado dentro de AuthProvider'
        )
    }

    return context
}
