import { Link } from 'react-router-dom'

export default function NotFoundPage() {
    return (
        <main className="not-found-page">
            <span className="not-found-number" aria-hidden="true">404</span>
            <div>
                <h1>Essa rota saiu do treino.</h1>
                <p>A página que você procurou não existe. Volte para sua rotina e continue de onde parou.</p>
                <Link className="button" to="/">Voltar ao início</Link>
            </div>
        </main>
    )
}
