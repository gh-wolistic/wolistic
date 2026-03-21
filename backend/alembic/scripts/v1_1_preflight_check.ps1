Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$alembicDir = Split-Path -Parent $scriptDir
$backendDir = Split-Path -Parent $alembicDir

if (-not (Test-Path (Join-Path $backendDir "alembic.ini"))) {
    throw "Unable to resolve backend directory from script path: $backendDir"
}

Push-Location $backendDir
try {
    Write-Host "Alembic current:"
    docker compose run --rm backend alembic current

    Write-Host "Alembic heads:"
    docker compose run --rm backend alembic heads

    Write-Host "Alembic history (last 10):"
    docker compose run --rm backend alembic history | Select-Object -Last 10
}
finally {
    Pop-Location
}
