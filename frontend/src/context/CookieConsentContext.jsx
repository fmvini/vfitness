import { createContext, useContext, useState } from 'react'

const CookieConsentContext = createContext(null)
const STORAGE_KEY = 'vfitness-cookie-choice'

function storedChoice() {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'accepted' || value === 'rejected' ? value : null
}

export function CookieConsentProvider({ children }) {
    const [choice, setChoice] = useState(storedChoice)
    const [open, setOpen] = useState(() => !storedChoice())

    function decide(value) {
        localStorage.setItem(STORAGE_KEY, value)
        setChoice(value)
        setOpen(false)
    }

    return (
        <CookieConsentContext.Provider value={{ choice, open, decide, openPreferences: () => setOpen(true) }}>
            {children}
        </CookieConsentContext.Provider>
    )
}

export function useCookieConsent() {
    return useContext(CookieConsentContext)
}
