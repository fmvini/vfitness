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

const responseCache = new Map()
let cacheVersion = 0
const CACHE_TTL_MS = 30_000

export function clearApiCache() {
    responseCache.clear()
    cacheVersion += 1
}

export async function getCached(path) {
    const key = `${localStorage.getItem('token') || ''}:${path}`
    const cached = responseCache.get(key)
    if (cached && cached.expires > Date.now()) return cached.promise

    const version = cacheVersion
    const promise = client.get(path).then(({ data }) => data).catch((error) => {
        if (responseCache.get(key)?.promise === promise) responseCache.delete(key)
        throw error
    })
    responseCache.set(key, { promise, expires: Date.now() + CACHE_TTL_MS })
    promise.then(() => {
        if (version !== cacheVersion) responseCache.delete(key)
    }).catch(() => {})
    return promise
}

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
    (response) => {
        if (response.config.method !== 'get') clearApiCache()
        return response
    },
    (error) => {
        // FastAPI devolve uma lista de objetos nos erros de validacao (422).
        // Os formularios precisam de texto, ou o React falha ao renderizar.
        const detail = error.response?.data?.detail
        if (Array.isArray(detail)) {
            error.response.data.detail = detail.map((item) => item.msg).join(' ')
        }
        if (error.response?.status === 401) {
            clearApiCache()
            localStorage.removeItem('token')
        }

        return Promise.reject(error)
    }
)

export default client
