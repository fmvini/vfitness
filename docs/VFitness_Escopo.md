# VFitness — Escopo Detalhado do Projeto

## 1. Contexto

Este documento descreve o escopo completo do VFitness, um sistema web de gestao de treinos. O objetivo do projeto e servir tanto como ferramenta pratica de treino quanto como projeto de portfolio, aplicando de forma integrada os conhecimentos ja adquiridos no curso de Analise e Desenvolvimento de Sistemas:

- Logica de programacao (C)
- Desenvolvimento web basico (HTML, CSS, JS)
- Programacao Orientada a Objetos (Python)
- Desenvolvimento frontend (React)
- Banco de dados relacional (SQL)

O projeto introduz, de forma guiada, conceitos novos que normalmente aparecem em semestres mais avancados: APIs REST, autenticacao (login tradicional e OAuth), modelagem de banco de dados relacional para um dominio real, e deploy de uma aplicacao full stack.

A ideia central do produto: o usuario cadastra seus treinos (presets), associa cada um a um dia da semana, e a aplicacao automaticamente abre o treino do dia quando o usuario acessa a pagina. O usuario registra cargas, repeticoes e tempo de descanso a cada execucao, construindo um historico que permite visualizar evolucao ao longo do tempo.

## 2. Escopo Funcional

### 2.1 Autenticacao
- Cadastro com email e senha
- Login com email e senha
- Login com Google (OAuth 2.0) — implementado em fase posterior, depois do login tradicional estar funcionando
- Logout
- Sessao persistente (o usuario nao precisa logar toda vez que abrir a pagina)

### 2.2 Gestao de Treinos (Presets)
- Criar um novo treino (preset), definindo:
  - Nome do treino (ex: "Dia de peito, ombro e triceps")
  - Dia da semana associado (ex: quinta-feira) — campo opcional, um treino pode nao ter dia fixo
- Editar nome ou dia de um treino existente
- Remover um treino (com confirmacao, ja que isso tambem afeta o historico associado)
- Listar todos os treinos cadastrados pelo usuario

### 2.3 Gestao de Exercicios dentro de um Treino
- Adicionar exercicio a um treino, contendo:
  - Nome do exercicio (ex: "Supino reto")
  - Numero de series
  - Numero de repeticoes (por serie, ou faixa como "8-12")
  - Carga (peso, em kg)
  - Tempo de descanso entre series (em segundos)
- Editar um exercicio existente
- Remover um exercicio de um treino
- Reordenar exercicios dentro do treino (opcional, fase avancada)

### 2.4 Deteccao de Treino do Dia
- Ao acessar a pagina principal, o sistema verifica o dia da semana atual
- Se existir um treino associado a esse dia, ele e exibido automaticamente em destaque
- Se nao houver treino associado ao dia, a pagina exibe a lista completa de treinos para escolha manual

### 2.5 Execucao e Registro de Treino
- O usuario abre um treino (preset) e visualiza os exercicios planejados
- Para cada exercicio, registra o que foi realmente executado: carga usada, repeticoes feitas, series completadas
- Esse registro gera uma entrada no historico, vinculada a data e ao exercicio
- Um mesmo exercicio, ao longo do tempo, acumula multiplos registros historicos, permitindo rastrear evolucao

### 2.6 Estatisticas e Progresso
- Peso total levantado (somatorio de carga x series x repeticoes) no dia, na semana e no mes
- Grafico de evolucao de carga para um exercicio especifico, comparando periodos (ultima semana, ultimo mes)
- Lista dos exercicios com maior progresso recente
- Frequencia de treinos (quantos dias treinados na semana/mes)

### 2.7 Responsividade e Design
- Layout adaptavel: funcional tanto em desktop quanto em dispositivos moveis
- Visual minimalista, com poucos elementos por tela e hierarquia visual clara
- Botoes com rotulos claros e diretos, evitando ambiguidade
- Modo escuro: cinza escuro (nunca preto puro) como cor base, azul como cor de destaque/acao
- Modo claro: branco como cor base, azul como cor de destaque/acao
- Alternancia entre modo claro e escuro disponivel para o usuario

## 3. Restricoes de Estilo de Conteudo (regra transversal do projeto)

Esta regra se aplica a **todo texto exibido na interface** (labels, mensagens, botoes, textos de ajuda, placeholders, mensagens de erro, emails transacionais, etc):

- Nao usar emojis em nenhum lugar da interface
- Nao usar travessoes (—) em nenhum texto; usar virgula, ponto ou reformular a frase
- Evitar excesso de exclamacoes ou linguagem excessivamente entusiasmada/artificial (ex: evitar "Uau, mandou muito bem!")
- Evitar textos genericos de "assistente de IA" (ex: "Estou aqui para ajudar voce a alcancar seus objetivos!")
- Mensagens devem ser diretas, objetivas e com tom humano/neutro, como um aplicativo profissional de treino
- Preferir frases curtas e claras a paragrafos longos em botoes, tooltips e confirmacoes

Essa regra deve ser validada em toda etapa de desenvolvimento de UI, e revisada antes de cada entrega de tela.

## 4. Arquitetura do Projeto

### 4.1 Visao Geral

Arquitetura em tres camadas, separando responsabilidades com clareza, seguindo padrao REST:

```
[ React (Frontend) ]  <--HTTP/JSON-->  [ FastAPI (Backend) ]  <--SQL-->  [ PostgreSQL (Banco de Dados) ]
```

- O frontend nunca acessa o banco diretamente; toda comunicacao passa pela API.
- A API e responsavel por regras de negocio, validacao e autenticacao.
- O banco armazena apenas dados; nao ha logica de negocio em nivel de banco (exceto constraints basicas de integridade).

### 4.2 Tecnologias Utilizadas

| Camada | Tecnologia | Motivo da escolha |
|---|---|---|
| Frontend | React (com Vite) | Voce ja tem base nisso; Vite e mais rapido e simples que Create React App |
| Estilizacao | CSS puro ou Tailwind CSS | CSS puro reforca fundamentos; Tailwind acelera caso queira ir mais rapido (escolha na Fase 1) |
| Gerenciamento de estado | Context API (nativo do React) | Suficiente para o tamanho do projeto, sem necessidade de Redux |
| Requisicoes HTTP | Axios ou Fetch API | Axios simplifica tratamento de erros e headers de autenticacao |
| Graficos | Recharts | Biblioteca React simples para os graficos de evolucao de carga |
| Backend | Python com FastAPI | Aproveita sua base de POO em Python; tipagem e documentacao automatica |
| ORM | SQLAlchemy | Padrao de mercado para Python, integra bem com FastAPI |
| Validacao de dados | Pydantic (nativo do FastAPI) | Validacao declarativa de entrada e saida da API |
| Banco de Dados | PostgreSQL | Robusto, gratuito, lida bem com relacionamentos complexos do dominio |
| Autenticacao tradicional | JWT (JSON Web Token) | Padrao para autenticacao stateless em APIs REST |
| Autenticacao Google | OAuth 2.0 (Google Identity Services) | Login social solicitado no escopo |
| Hash de senha | passlib (bcrypt) | Nunca armazenar senha em texto puro |
| Migracoes de banco | Alembic | Controle de versao do schema do banco, integrado ao SQLAlchemy |
| Hospedagem Frontend | Vercel ou Netlify | Deploy gratuito e simples para projetos React |
| Hospedagem Backend | Render ou Railway | Deploy gratuito/barato para APIs Python, com suporte a PostgreSQL |

### 4.3 Estrutura de Pastas Proposta

```
vfitness/
  backend/
    app/
      main.py                 # ponto de entrada da API FastAPI
      config.py                # variaveis de ambiente e configuracoes
      database.py              # conexao com PostgreSQL via SQLAlchemy
      models/                  # classes ORM (tabelas do banco)
        user.py
        workout.py
        exercise.py
        exercise_log.py
      schemas/                 # classes Pydantic (validacao de entrada/saida)
        user_schema.py
        workout_schema.py
        exercise_schema.py
        log_schema.py
      routers/                 # rotas da API, organizadas por recurso
        auth_router.py
        workout_router.py
        exercise_router.py
        stats_router.py
      services/                # regras de negocio (logica separada das rotas)
        auth_service.py
        workout_service.py
        stats_service.py
      auth/
        jwt_handler.py
        google_oauth.py
        password_hash.py
    alembic/                   # migracoes de banco
    requirements.txt
    .env.example

  frontend/
    src/
      main.jsx
      App.jsx
      api/                     # funcoes de chamada a API
        client.js
        authApi.js
        workoutApi.js
        statsApi.js
      context/
        AuthContext.jsx
        ThemeContext.jsx
      pages/
        LoginPage.jsx
        RegisterPage.jsx
        DashboardPage.jsx
        WorkoutDetailPage.jsx
        StatsPage.jsx
      components/
        WorkoutCard.jsx
        ExerciseForm.jsx
        ExerciseItem.jsx
        WeekdaySelector.jsx
        ProgressChart.jsx
        ThemeToggle.jsx
        Navbar.jsx
      styles/
        theme.css              # variaveis de cor (modo claro/escuro)
        global.css
      utils/
        weekdayDetector.js      # logica de detectar dia da semana atual
    index.html
    package.json
    vite.config.js

  docs/
    VFitness_Escopo.md          # este arquivo
```

### 4.4 Modelo de Dados (Entidades Principais)

**User**
- id (PK)
- name
- email (unico)
- password_hash (nulo se login for via Google)
- google_id (nulo se login for tradicional)
- created_at

**Workout** (preset de treino)
- id (PK)
- user_id (FK para User)
- name (ex: "Dia de peito, ombro e triceps")
- weekday (enum: segunda, terca, quarta, quinta, sexta, sabado, domingo, ou nulo)
- created_at

**Exercise** (exercicio dentro de um treino)
- id (PK)
- workout_id (FK para Workout)
- name (ex: "Supino reto")
- target_sets (series planejadas)
- target_reps (repeticoes planejadas)
- target_rest_seconds (descanso planejado)
- order_index (posicao dentro do treino)

**ExerciseLog** (historico de execucao)
- id (PK)
- exercise_id (FK para Exercise)
- user_id (FK para User, redundante mas util para queries de estatisticas)
- performed_sets
- performed_reps
- performed_load (carga usada, em kg)
- performed_at (data e hora do registro)

Relacionamentos: um User tem varios Workouts; um Workout tem varios Exercises; um Exercise tem varios ExerciseLogs ao longo do tempo. Essa modelagem permite calcular estatisticas agregando ExerciseLog por periodo de tempo.

## 5. Ordem de Desenvolvimento

O projeto deve ser construido em fases incrementais. Cada fase produz algo funcional antes de avancar para a proxima, evitando ficar com codigo pela metade em varias frentes ao mesmo tempo.

### Fase 0: Preparacao do Ambiente
1. Instalar Python 3.11+, Node.js LTS, PostgreSQL localmente (ou via Docker)
2. Criar repositorio Git com a estrutura de pastas descrita na secao 4.3
3. Configurar backend: ambiente virtual Python, instalar FastAPI, Uvicorn, SQLAlchemy, Pydantic
4. Configurar frontend: `npm create vite@latest` com template React
5. Validar que backend (`uvicorn app.main:app --reload`) e frontend (`npm run dev`) sobem corretamente e conversam entre si com uma rota de teste simples (ex: `/health`)

### Fase 1: Modelagem e Banco de Dados
1. Definir os modelos SQLAlchemy (User, Workout, Exercise, ExerciseLog) conforme secao 4.4
2. Configurar Alembic e gerar a primeira migracao
3. Rodar a migracao no PostgreSQL local e validar as tabelas criadas
4. Popular o banco manualmente com dados de teste (seed) para validar a modelagem antes de construir a API

### Fase 2: Autenticacao Tradicional (Backend)
1. Implementar cadastro de usuario (hash de senha com bcrypt)
2. Implementar login (validacao de senha, geracao de JWT)
3. Implementar middleware/dependencia do FastAPI para proteger rotas que exigem usuario autenticado
4. Testar todos os endpoints de autenticacao via Swagger (`/docs`, gerado automaticamente pelo FastAPI)

### Fase 3: Autenticacao Tradicional (Frontend)
1. Criar paginas de cadastro e login em React
2. Criar AuthContext para armazenar o usuario logado e o token JWT
3. Implementar chamadas a API de autenticacao
4. Implementar logica de rotas protegidas (redirecionar para login se nao autenticado)
5. Persistir sessao (token salvo de forma segura, revalidado ao recarregar a pagina)

### Fase 4: CRUD de Treinos e Exercicios (Backend)
1. Implementar rotas para criar, listar, editar e remover Workouts
2. Implementar rotas para criar, listar, editar e remover Exercises dentro de um Workout
3. Garantir que todas as rotas validam que o recurso pertence ao usuario autenticado (evitar acesso a dados de outro usuario)
4. Testar todos os endpoints via Swagger

### Fase 5: CRUD de Treinos e Exercicios (Frontend)
1. Criar tela de listagem de treinos (Dashboard)
2. Criar formulario de criacao/edicao de treino, incluindo o seletor de dia da semana
3. Criar formulario de adicao/edicao de exercicio (nome, series, repeticoes, carga, descanso)
4. Implementar remocao de treino e exercicio, com confirmacao antes de excluir
5. Implementar a logica de deteccao do dia da semana atual, destacando automaticamente o treino correspondente

### Fase 6: Registro de Execucao e Historico (Backend + Frontend)
1. Backend: implementar rota para registrar um ExerciseLog (execucao real de um exercicio)
2. Frontend: criar tela de "execucao do treino", onde o usuario registra carga, series e repeticoes feitas por exercicio
3. Validar que os registros ficam corretamente vinculados a data e ao exercicio

### Fase 7: Estatisticas e Graficos
1. Backend: implementar rotas de agregacao (soma de peso levantado por periodo, evolucao de carga por exercicio)
2. Frontend: criar tela de estatisticas usando Recharts para exibir os graficos de evolucao
3. Implementar filtros de periodo (dia, semana, mes)

### Fase 8: Estilizacao, Responsividade e Modo Escuro/Claro
1. Definir variaveis CSS de cor conforme paleta da secao 2.7 (cinza escuro e azul no modo escuro; branco e azul no modo claro)
2. Implementar ThemeContext para alternancia de tema
3. Ajustar layout com media queries (ou classes utilitarias, se usar Tailwind) para funcionar bem em telas pequenas
4. Revisar todos os textos da interface conforme as restricoes da secao 3 (sem emojis, sem travessoes, tom direto)

### Fase 9: Login com Google (OAuth)
1. Criar projeto no Google Cloud Console e obter credenciais OAuth
2. Backend: implementar endpoint de callback OAuth, validando o token do Google e criando/associando o usuario
3. Frontend: adicionar botao de "Entrar com Google" na tela de login, integrando com Google Identity Services
4. Testar fluxo completo: usuario novo via Google (cria conta automaticamente) e usuario existente via Google (associa a conta)

### Fase 10: Deploy
1. Publicar o backend (Render ou Railway), configurando variaveis de ambiente e banco PostgreSQL em nuvem
2. Publicar o frontend (Vercel ou Netlify), apontando para a URL do backend em producao
3. Validar CORS entre frontend e backend em producao
4. Teste final ponta a ponta em ambiente de producao

### Fase 11 (opcional, pos-MVP): Refinamentos
- Reordenar exercicios dentro de um treino (drag and drop)
- Exportar historico de treinos em PDF ou CSV
- Notificacoes/lembretes de treino do dia
- Metas personalizadas por exercicio (ex: "chegar a 100kg no supino")

## 6. Criterios de Pronto (Definition of Done) do MVP

O projeto pode ser considerado um MVP funcional quando:
- Um usuario consegue se cadastrar e logar (tradicional e Google)
- Um usuario consegue criar, editar e remover treinos e exercicios
- Ao acessar a pagina em um dia com treino associado, esse treino aparece automaticamente
- Um usuario consegue registrar a execucao de um treino (carga, series, repeticoes)
- Um usuario consegue visualizar peso total levantado no periodo e grafico de evolucao de ao menos um exercicio
- A interface funciona corretamente em tela de desktop e em tela de celular
- O modo escuro e claro funcionam e seguem a paleta definida
- Nenhum texto da interface contem emoji, travessao, ou linguagem tipica de "resposta de IA"
