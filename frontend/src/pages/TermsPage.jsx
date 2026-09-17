import { Link } from 'react-router-dom'

export default function TermsPage() {
    return (
        <main className="legal-page">
            <Link className="text-link" to="/">← Voltar ao VFitness</Link>
            <h1>Termos de Uso</h1>
            <p className="legal-updated">Atualizados em 17 de setembro de 2026</p>
            <p>Ao criar uma conta no VFitness, você concorda com estes termos e confirma que leu a <Link to="/privacidade">Política de Privacidade</Link>. O aceite é registrado com data e hora.</p>

            <h2>O serviço</h2>
            <p>O VFitness permite planejar treinos, registrar atividades e acompanhar estatísticas pessoais. O conteúdo inserido na conta é de sua responsabilidade. As informações exibidas não substituem orientação médica ou profissional de educação física.</p>

            <h2>Sua conta</h2>
            <p>Forneça informações corretas, mantenha suas credenciais em sigilo e use a plataforma de forma lícita. Não tente acessar dados de outras pessoas, interferir no serviço ou automatizar solicitações abusivas.</p>

            <h2>Disponibilidade e dados</h2>
            <p>Podemos realizar manutenção e corrigir ou alterar recursos. Empregamos medidas razoáveis de segurança, mas o serviço pode apresentar interrupções. Mantenha cópias das informações que considerar importantes. O tratamento dos seus dados está descrito na Política de Privacidade.</p>

            <h2>Encerramento e contato</h2>
            <p>Você pode deixar de usar o serviço a qualquer momento e solicitar a exclusão da conta e dos dados associados pelo e-mail <a href="mailto:viniciusfmarrocos@gmail.com">viniciusfmarrocos@gmail.com</a>. Podemos restringir uso que viole estes termos, observada a legislação aplicável.</p>

            <h2>Alterações</h2>
            <p>Estes termos podem ser atualizados. A versão vigente e a data de atualização estarão sempre disponíveis nesta página.</p>
        </main>
    )
}
