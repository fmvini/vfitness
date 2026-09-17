import { Link } from 'react-router-dom'

export default function PrivacyPage() {
    return (
        <main className="legal-page">
            <Link className="text-link" to="/">← Voltar ao VFitness</Link>
            <h1>Política de Privacidade</h1>
            <p className="legal-updated">Atualizada em 17 de setembro de 2026</p>
            <p>Esta política explica como o VFitness trata dados quando você cria uma conta e registra seus treinos. Para dúvidas ou para exercer seus direitos, escreva para <a href="mailto:viniciusfmarrocos@gmail.com">viniciusfmarrocos@gmail.com</a>.</p>

            <h2>Dados que usamos</h2>
            <p>Na conta, coletamos nome e e-mail. A senha é armazenada como hash, sem guardar o texto original. Se você escolher entrar com Google, recebemos seu identificador, nome e e-mail dessa plataforma. Também guardamos treinos, exercícios, dias programados e registros de execução que você inserir.</p>

            <h2>Para que usamos os dados</h2>
            <p>Usamos essas informações para autenticar sua conta, apresentar sua rotina, registrar sessões e calcular estatísticas de progresso. Registros técnicos de acesso podem ser processados para segurança, diagnóstico e limitação de solicitações.</p>

            <h2>Armazenamento e terceiros</h2>
            <p>Os dados da conta e dos treinos ficam no banco de dados usado pelo projeto, hospedado no Supabase. O aplicativo e a API são hospedados na Vercel. O login com Google só é carregado após a sua escolha de aceitar recursos opcionais; ao usá-lo, o Google pode tratar dados conforme suas próprias políticas. Não vendemos seus dados nem usamos publicidade comportamental no VFitness.</p>

            <h2>Cookies e armazenamento local</h2>
            <p>O VFitness usa armazenamento local essencial para guardar o token de sessão, o tema, a escolha de treino do dia e sua preferência de cookies. Esses itens são necessários para as funções que você solicita. Ao aceitar os opcionais, o botão de login com Google pode carregar recursos de terceiros. Você pode rejeitar ou alterar essa escolha em “Preferências de cookies” no rodapé.</p>

            <h2>Prazo e direitos</h2>
            <p>Mantemos os dados enquanto a conta estiver ativa ou pelo período necessário para cumprir obrigações aplicáveis. Você pode pedir acesso, correção, informação sobre o tratamento ou exclusão dos seus dados pelo e-mail acima. A exclusão pode estar sujeita a obrigações legais de conservação. Você também pode apagar os dados locais do navegador nas configurações do próprio navegador.</p>

            <h2>Segurança e mudanças</h2>
            <p>Usamos autenticação, controle de acesso por usuário e conexão segura nos serviços de produção. Nenhum sistema elimina todo risco. Se esta política mudar de forma relevante, atualizaremos esta página e sua data.</p>
        </main>
    )
}
