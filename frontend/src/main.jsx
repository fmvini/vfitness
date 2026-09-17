import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { CookieConsentProvider } from './context/CookieConsentContext'

import './styles/theme.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <CookieConsentProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
            </CookieConsentProvider>
        </ThemeProvider>
    </React.StrictMode>
)
