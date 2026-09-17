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
    const [connectionError, setConnectionError] = useState(false)

    const isAuthenticated = !!user

    useEffect(() => {
        initializeAuth()
    }, [])

    async function initializeAuth() {
        setLoading(true)
        setConnectionError(false)
        const token = localStorage.getItem('token')

        if (!token) {
            setLoading(false)
            return
        }

        try {
            const userData = await getCurrentUser()
            setUser(userData)
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token')
                setUser(null)
            } else {
                setConnectionError(true)
            }
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
        setConnectionError(false)

        return response
    }

    async function register(name, email, password, acceptTerms) {
        const response = await registerRequest({
            name,
            email,
            password,
            accept_terms: acceptTerms
        })

        const userData = await getCurrentUser()
        setUser(userData)
        setConnectionError(false)
        return response
    }

    async function loginWithGoogle(credential, acceptTerms) {
        const response = await googleLoginRequest(credential, acceptTerms)
        const userData = await getCurrentUser()
        setUser(userData)
        setConnectionError(false)
        return response
    }

    function logout() {
        logoutRequest()
        setUser(null)
        setConnectionError(false)
    }

    const value = {
        user,
        loading,
        connectionError,
        retryConnection: initializeAuth,
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
