import { Link } from 'react-router-dom'
import { useCookieConsent } from '../context/CookieConsentContext'

export default function SiteFooter() {
    const { openPreferences } = useCookieConsent()
    return (
        <footer className="site-footer">
            <span>© {new Date().getFullYear()} VFitness</span>
            <nav aria-label="Informações legais">
                <Link to="/privacidade">Privacidade</Link>
                <Link to="/termos">Termos de Uso</Link>
                <button type="button" onClick={openPreferences}>Preferências de cookies</button>
            </nav>
        </footer>
    )
}
