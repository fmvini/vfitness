## 2026-10-03 — Correção do driver PostgreSQL na Vercel

### Implementado
- URLs `postgres://` e `postgresql://` normalizadas para `postgresql+psycopg2://`, selecionando o driver já instalado em vez do padrão variável do SQLAlchemy.
- Preservação integral das credenciais escapadas, host, porta, path e query; URLs com driver explícito e outros dialetos mantidos sem alteração.
- Quatro testes de regressão para normalização, idempotência, preservação e carregamento da DBAPI sem conectar ao banco real.
- Cache de QA excluído dos uploads da CLI Vercel e README atualizado com o contrato de conexão e o preview já publicado.

### Arquivos principais alterados
- `backend/app/database.py`
- `backend/tests/test_database_url.py`
- `.vercelignore`
- `README.md`
- `docs/DEVELOPMENT_LOG.md`

### Decisões técnicas
- Logs do deployment `dpl_9N1P6GNtyH5b8Ttn96RpyrU9dw23` confirmaram falha no import de `psycopg` em `create_engine`, impedindo inclusive `/health` e o preflight CORS.
- SQLAlchemy 2.1 mudou o driver padrão das URLs PostgreSQL genéricas para psycopg3; `requirements.txt` instala psycopg2. Escolher explicitamente psycopg2 evita depender desse padrão sem adicionar outra DBAPI.
- A normalização já é compartilhada pelo runtime e pelo Alembic. Não alterar banco, migrations, credenciais, autenticação ou dependências para esta correção.
- Maestro coordenou auditorias read-only dos três agentes; backend implementou o helper e os testes. Diagnóstico por endpoints/logs públicos e CLI autenticada, sem expor segredos.

### Estado atual
- Backend: 12 testes aprovados com SQLAlchemy 2.0.52 e com SQLAlchemy 2.1.0 instalado somente em cache temporário. URL genérica reproduziu `ModuleNotFoundError: psycopg` no 2.1; normalização corrigida carregou psycopg2 sem conexão real.
- Frontend: 16 testes aprovados. `/preview` publicado foi verificado no navegador durante a indisponibilidade da API: exemplos carregaram sem chamadas ao backend nem erro de conexão.
- Correção validada localmente; produção ainda retorna 500 no deployment antigo e precisa receber o novo backend.

### Próximos passos
- Publicar a correção no projeto Vercel `vfitness-backend`, preservando as variáveis existentes, e confirmar `/health` e `/health/ready` com 200, `/auth/me` anônimo com 401 e preflight com 200/CORS correto.
- Registrar o deployment e os resultados da verificação após a publicação; não executar migrations nem fazer push automático.

## 2026-10-03 — Preview público para recrutadores

### Implementado
- Rota `/preview` acessível sem login, reutilizando painel, treino do dia, configuração de exercícios, execução de sessões e estatísticas.
- Navegação interna e links legais mantidos no prefixo `/preview`; contexto de usuário fictício separado da autenticação real.
- Operações de treinos, exercícios, ordenação, logs e estatísticas atendidas por adapter local, sem HTTP ou acesso ao banco.
- Quatro treinos, 14 exercícios de musculação/cardio e 110 registros sintéticos, com datas relativas e treino disponível hoje.
- Banner explicativo e botão para reiniciar a demonstração, restaurar os exemplos e limpar progresso/seleção exclusivos do preview.

### Arquivos principais alterados
- `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/context/AuthContext.jsx`
- `frontend/src/preview/demoData.js`, `frontend/src/preview/previewApi.js`, `frontend/src/preview/previewMode.js`
- `frontend/src/api/workoutApi.js`, `frontend/src/api/statsApi.js`
- `frontend/src/utils/routePath.js`, `frontend/src/utils/previewUiStorage.js`, `frontend/src/utils/dailyWorkoutSelection.js`
- `frontend/src/components/Navbar.jsx`, `frontend/src/components/WorkoutCard.jsx`, `frontend/src/components/SiteFooter.jsx`, `frontend/src/components/CookieBanner.jsx`
- `frontend/src/pages/DashboardPage.jsx`, `frontend/src/pages/TodayWorkoutPage.jsx`, `frontend/src/pages/WorkoutDetailPage.jsx`, `frontend/src/pages/WorkoutSessionPage.jsx`
- `frontend/src/pages/NotFoundPage.jsx`, `frontend/src/pages/PrivacyPage.jsx`, `frontend/src/pages/TermsPage.jsx`, `frontend/src/styles/global.css`
- `frontend/tests/demoData.test.js`, `frontend/tests/previewApi.test.js`, `frontend/tests/previewNavigation.test.js`, `backend/tests/test_preview_isolation.py`
- `frontend/package.json`, `README.md`, `docs/DEVELOPMENT_LOG.md`

### Decisões técnicas
- Estado de demonstração somente em memória por aba: navegação SPA preserva alterações; reset e recarga descartam os dados. Progresso da sessão e seleção diária também usam memória exclusiva.
- Não criar conta pública, seeds, migrations, endpoints anônimos ou mudanças de RLS. O backend e o banco reais mantêm a autenticação e o isolamento existentes.
- Maestro coordenou os agentes conectados do Maestri: frontend cuidou das telas/rotas; backend, do adapter/contratos; banco de dados, dos exemplos e sua compatibilidade com os schemas.
- Integração e documentação reunidas pelo Maestro em uma unidade lógica; commit local centralizado para evitar commits paralelos.

### Estado atual
- QA no navegador com a API desligada: criação de treino, musculação e cardio, finalização da sessão, atualização das estatísticas e reset passaram.
- Token e progresso real previamente salvos permaneceram intactos durante o preview; nenhuma requisição de API ocorreu. Acesso anônimo a `/stats` continuou redirecionando para `/login`.
- Navegação mobile verificada em 390 px sem overflow horizontal; troca do treino de hoje e retorno da rota inexistente também permaneceram no preview.
- `npm test`: 16 testes aprovados (fixtures, adapter/dispatch e navegação). Backend: 8 testes aprovados, incluindo 36 verificações de acesso anônimo negado em operações reais, com e sem cabeçalhos de preview.
- Testes do frontend executados com Node.js 24 e `--test-isolation=none` para evitar subprocessos bloqueados no ambiente.
- Bundle completo compilado e usado no QA com esbuild direto. `npm run build`/Vite bloqueado no ambiente por `spawn EPERM` ao iniciar esbuild; essa validação padrão ainda deve ser executada em ambiente que permita subprocessos.
- Diff integrado revisado e `git diff --check` aprovado; nenhuma dependência ou configuração de deploy foi alterada.
- A tentativa inicial de `git add` foi bloqueada por falta de permissão em `.git/index.lock`; após o usuário alterar a autorização, os arquivos revisados foram adicionados ao índice para o commit local. Testes repetidos: 16 frontend e 8 backend aprovados. Nenhuma publicação ou push foi realizado.
- Versão ainda não publicada; o link de produção `/preview` depende do deploy deste commit.

### Próximos passos
- Executar `npm run build` em ambiente com subprocessos permitidos.
- Quando solicitado, publicar o frontend e validar acesso direto e recarga em `https://vfitness-app.vercel.app/preview`; backend/banco não precisam de migração para esta funcionalidade.
