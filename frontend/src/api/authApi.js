import client, { clearApiCache } from './client'

function persistToken(data) {
    if (data.access_token) {
        clearApiCache()
        localStorage.setItem('token', data.access_token)
    }

    return data
}

export async function register(userData) {
    const response = await client.post('/auth/register', userData)
    return persistToken(response.data)
}

export async function login(credentials) {
    const response = await client.post('/auth/login', credentials)

    return persistToken(response.data)
}

export async function logout() {
    clearApiCache()
    localStorage.removeItem('token')
}

export async function getCurrentUser() {
    const response = await client.get('/auth/me')
    return response.data
}

export async function loginWithGoogle(token, acceptTerms) {
    const response = await client.post('/auth/google', {
        id_token: token,
        accept_terms: acceptTerms
    })

    return persistToken(response.data)
}
