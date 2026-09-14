import client from './client'

export async function register(userData) {
    const response = await client.post('/auth/register', userData)
    return response.data
}

export async function login(credentials) {
    const response = await client.post('/auth/login', credentials)

    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
    }

    return response.data
}

export async function logout() {
    localStorage.removeItem('token')
}

export async function getCurrentUser() {
    const response = await client.get('/auth/me')
    return response.data
}

export async function loginWithGoogle(token) {
    const response = await client.post('/auth/google', {
        token
    })

    return response.data
}