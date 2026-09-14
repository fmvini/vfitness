import axios from 'axios'

const LOCAL_API_URL = 'http://localhost:8000'
const PRODUCTION_API_URL = 'https://vfitness-backend.vercel.app'

function resolveApiUrl() {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }

    if (
        typeof window !== 'undefined' &&
        window.location.hostname === 'vfitness-frontend.vercel.app'
    ) {
        return PRODUCTION_API_URL
    }

    return LOCAL_API_URL
}

const client = axios.create({
    baseURL: resolveApiUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
})

client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
        }

        return Promise.reject(error)
    }
)

export default client
