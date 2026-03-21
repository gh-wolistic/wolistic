param(
    [Parameter(Mandatory = $true)]
    [string]$RevisionId
)

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
    Write-Host "Checking alembic heads..."
    docker compose run --rm backend alembic heads

    Write-Host "Stamping database to revision: $RevisionId"
    docker compose run --rm backend alembic stamp $RevisionId

    Write-Host "Verifying current revision..."
    docker compose run --rm backend alembic current
}
finally {
    Pop-Location
}
