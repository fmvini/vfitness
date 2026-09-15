# VFitness

Aplicacao full stack para gestao de treinos, registro de execucoes e
acompanhamento de progresso.

## Requisitos

- Python 3.11 ou superior
- Node.js LTS
- PostgreSQL

## Configuracao local

1. Copie `backend/.env.example` para `backend/.env` e defina uma
   `SECRET_KEY` longa e aleatoria.
2. Confirme que `DATABASE_URL` aponta para um banco PostgreSQL acessivel.
3. Copie `frontend/.env.example` para `frontend/.env`.
4. No diretorio `backend`, instale as dependencias e execute as migracoes:

```powershell
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
..\.venv\Scripts\python.exe -m alembic upgrade head
```

5. Inicie a API no diretorio `backend`:

```powershell
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

6. Inicie o frontend no diretorio `frontend`:

```powershell
npm install
npm run dev
```

O frontend fica em `http://localhost:5173`, a API em
`http://localhost:8000` e a documentacao interativa em
`http://localhost:8000/docs`.

## Login com Google

Crie uma credencial do tipo ID do cliente OAuth para aplicacao Web no
Google Cloud Console. Cadastre `http://localhost:5173` em Origens JavaScript
autorizadas e use o mesmo Client ID nos dois arquivos:

```dotenv
# backend/.env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com

# frontend/.env
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
```

Reinicie a API e o Vite depois de alterar variaveis de ambiente. O fluxo
atual usa o Google Identity Services e valida o ID token no backend, por isso
nao precisa de Client Secret nem URI de callback em ambiente local.

## Deploy na Vercel com Supabase

O projeto esta dividido em dois deploys:

- Frontend: `https://vfitness-frontend.vercel.app`
- Backend: `https://vfitness-backend.vercel.app`

No projeto do frontend na Vercel, configure:

```dotenv
VITE_API_URL=https://vfitness-backend.vercel.app
```

No projeto do backend na Vercel, configure:

```dotenv
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=gere-uma-chave-longa-e-aleatoria
CORS_ORIGINS=["https://vfitness-frontend.vercel.app"]
DATABASE_URL=postgresql://postgres.qcjhtkiohtmmvpnjcvvw:<senha-escapada>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

A URL publica do projeto Supabase (`https://qcjhtkiohtmmvpnjcvvw.supabase.co`)
nao substitui a `DATABASE_URL`: o backend precisa da connection string do
Postgres, encontrada no painel do Supabase em Project Settings > Database.

Depois de configurar a `DATABASE_URL`, execute as migracoes do Alembic contra
o banco online antes de usar o app em producao:

```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres.qcjhtkiohtmmvpnjcvvw:<senha-escapada>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
..\.venv\Scripts\python.exe -m alembic upgrade head
```

O runtime usa o transaction pooler (6543); as migracoes usam o session pooler
(5432). As tabelas possuem RLS sem politicas publicas: o acesso aos dados passa
pela API FastAPI, que autentica o usuario e verifica a propriedade dos registros.

### Operacao e verificacao

O backend usa Python 3.12 na Vercel. Os diretorios raiz dos projetos sao
`backend` e `frontend`, respectivamente. Execute o deploy a partir da raiz
do repositorio, selecionando o projeto correto:

```powershell
# Backend
$env:VERCEL_ORG_ID="team_AFHpEVNFJOSSWN7k9dBDeM6X"
$env:VERCEL_PROJECT_ID="prj_6dMFxNXGkJHDTQbo6EsbDy3Ialgk"
npx vercel@59.17.0 deploy --prod --yes --scope fmvini-projects

# Frontend
$env:VERCEL_PROJECT_ID="prj_4BP3xw56kKUMWbJ5Jfnq3kSuduu4"
npx vercel@59.17.0 deploy --prod --yes --scope fmvini-projects
```

`GET /health` verifica o processo; `GET /health/ready` verifica o acesso as
tabelas no Supabase. Os segredos de producao ficam na Vercel e no arquivo local
ignorado `backend/.env.production`, nunca no codigo ou no bundle do frontend.

`backend/configure_production.py` configura os dois projetos a partir desse
arquivo (campo `SUPABASE_DB_PASSWORD`) e preserva a `SECRET_KEY` ja gerada nele.
Com `--migrate`, aplica apenas as migracoes. Requer login previo na CLI da Vercel.
O Client ID Google vem de `backend/.env`; a origem
`https://vfitness-frontend.vercel.app` deve estar autorizada no Google Cloud.

Testes locais, dentro do diretorio `backend`:

```powershell
..\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

`backend/smoke_production.py` testa a API publicada usando uma conta sintetica
e remove somente os dados criados pelo teste. Requer as dependencias de
desenvolvimento e `backend/.env.production` com a `DATABASE_URL` configurada.
