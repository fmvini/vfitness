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
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
```

5. Inicie a API no diretorio `backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
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
