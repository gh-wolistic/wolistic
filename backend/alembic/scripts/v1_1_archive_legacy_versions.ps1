param(
    [Parameter(Mandatory = $true)]
    [string]$BaselineFileName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$alembicDir = Split-Path -Parent $scriptDir
$versionsDir = Join-Path $alembicDir "versions"
$archiveDir = Join-Path $alembicDir "versions_archive_pre_v1_1"

if (-not (Test-Path $versionsDir)) {
    throw "Versions directory not found: $versionsDir"
}

if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
}

$baselinePath = Join-Path $versionsDir $BaselineFileName
if (-not (Test-Path $baselinePath)) {
    throw "Baseline revision file not found in versions directory: $BaselineFileName"
}

$files = Get-ChildItem -Path $versionsDir -Filter "*.py" -File

$keep = @($BaselineFileName)
$moved = @()

foreach ($file in $files) {
    if ($keep -contains $file.Name) {
        continue
    }

    $target = Join-Path $archiveDir $file.Name
    Move-Item -Path $file.FullName -Destination $target -Force
    $moved += $file.Name
}

Write-Host "Archived $($moved.Count) legacy revision file(s) to $archiveDir"
Write-Host "Kept active revision: $BaselineFileName"

if ($moved.Count -gt 0) {
    Write-Host "Moved files:"
    $moved | Sort-Object | ForEach-Object { Write-Host " - $_" }
}
