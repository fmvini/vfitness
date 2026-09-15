import axios from 'axios'

const LOCAL_API_URL = 'http://localhost:8000'
const PRODUCTION_API_URL = 'https://vfitness-backend.vercel.app'

function resolveApiUrl() {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }

    return import.meta.env.PROD ? PRODUCTION_API_URL : LOCAL_API_URL
}

const client = axios.create({
    baseURL: resolveApiUrl(),
    timeout: 30000,
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
        // FastAPI devolve uma lista de objetos nos erros de validacao (422).
        // Os formularios precisam de texto, ou o React falha ao renderizar.
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
            error.response.data.detail = detail.map((item) => item.msg).join(' ')
        }
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
        }

        return Promise.reject(error)
    }
)

export default client
