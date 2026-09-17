import { Link } from 'react-router-dom'
import { useCookieConsent } from '../context/CookieConsentContext'

export default function CookieBanner() {
    const { open, decide } = useCookieConsent()
    if (!open) return null

    return (
        <section className="cookie-banner" aria-label="Preferências de cookies">
            <div>
                <h2>Suas preferências de cookies</h2>
                <p>Usamos armazenamento essencial para manter sua sessão e suas escolhas. Com sua permissão, o login com Google pode carregar recursos e cookies de terceiros. Saiba mais na <Link to="/privacidade">Política de Privacidade</Link>.</p>
            </div>
            <div className="cookie-actions">
                <button type="button" className="button-secondary" onClick={() => decide('rejected')}>Rejeitar opcionais</button>
                <button type="button" onClick={() => decide('accepted')}>Aceitar opcionais</button>
            </div>
        </section>
    )
}
