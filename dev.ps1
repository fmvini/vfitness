param(
    [int]$ApiPort = 8000,
    [int]$WebPort = 5173
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
$apiBase = "http://127.0.0.1:$ApiPort"
$webBase = "http://127.0.0.1:$WebPort"
$apiJob = $null
$locationPushed = $false
$previousApiUrl = [Environment]::GetEnvironmentVariable('VITE_API_URL', 'Process')

function Test-Endpoint([string]$Url) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw 'Ambiente Python ausente em .venv\Scripts\python.exe. Consulte o README para instalar o backend.'
}

try {
    if (-not (Test-Endpoint "$apiBase/health")) {
        Write-Host 'Iniciando a API VFitness...'
        $apiJob = Start-Job -ScriptBlock {
            param($Python, $Backend, $Port)
            Set-Location -LiteralPath $Backend
            & $Python -m uvicorn app.main:app --host 127.0.0.1 --port $Port
        } -ArgumentList $pythonPath, $backendPath, $ApiPort

        $apiStarted = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if (Test-Endpoint "$apiBase/health") {
                $apiStarted = $true
                break
            }
            if ($apiJob.State -ne 'Running') { break }
            Start-Sleep -Seconds 1
        }
        if (-not $apiStarted) {
            Receive-Job -Job $apiJob
            throw "Falha ao iniciar a API em $apiBase."
        }
    }

    if (-not (Test-Endpoint "$apiBase/health/ready")) {
        throw 'A API iniciou, mas o banco esta indisponivel. Verifique o servico PostgreSQL e DATABASE_URL no backend.'
    }

    Write-Host "API e banco prontos: $apiBase"
    [Environment]::SetEnvironmentVariable('VITE_API_URL', $apiBase, 'Process')

    if (Test-Endpoint $webBase) {
        Write-Host "Frontend em execucao: $webBase"
        if ($apiJob) {
            Write-Host 'Mantenha este terminal aberto para conservar a API ativa. Use Ctrl+C para parar.'
            Wait-Job -Job $apiJob | Out-Null
        }
        return
    }

    Push-Location -LiteralPath $frontendPath
    $locationPushed = $true
    Write-Host "Iniciando o frontend: $webBase"
    & npm run dev:frontend -- --host 127.0.0.1 --port $WebPort --strictPort
    if ($LASTEXITCODE -ne 0) {
        throw "O frontend encerrou com codigo $LASTEXITCODE."
    }
} finally {
    if ($locationPushed) { Pop-Location }
    [Environment]::SetEnvironmentVariable('VITE_API_URL', $previousApiUrl, 'Process')
    if ($apiJob) {
        Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
        Remove-Job -Job $apiJob -Force -ErrorAction SilentlyContinue
    }
}
