import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

export default function GoogleLoginButton({ onCredential, disabled }) {
    const containerRef = useRef(null)
    const [error, setError] = useState('')
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    useEffect(() => {
        if (!clientId || disabled) {
            return undefined
        }

        function renderButton() {
            if (!window.google || !containerRef.current) {
                return
            }

            containerRef.current.innerHTML = ''
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => onCredential(response.credential)
            })
            window.google.accounts.id.renderButton(
                containerRef.current,
                {
                    theme: 'outline',
                    size: 'large',
                    width: Math.min(containerRef.current.offsetWidth, 400),
                    text: 'signin_with'
                }
            )
        }

        const existingScript = document.querySelector(
            `script[src="${GOOGLE_SCRIPT_URL}"]`
        )

        if (window.google) {
            renderButton()
            return undefined
        }

        const script = existingScript || document.createElement('script')
        if (!existingScript) {
            script.src = GOOGLE_SCRIPT_URL
            script.async = true
            script.defer = true
            document.head.appendChild(script)
        }

        script.addEventListener('load', renderButton)
        script.addEventListener('error', () => {
            setError('Não foi possível carregar o login com Google.')
        })

        return () => script.removeEventListener('load', renderButton)
    }, [clientId, disabled, onCredential])

    if (!clientId) {
        return null
    }

    return (
        <div className="google-login">
            <div className="auth-divider"><span>ou</span></div>
            <div ref={containerRef} className="google-button" />
            {error && <p className="form-error">{error}</p>}
        </div>
    )
}
