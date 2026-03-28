# ══════════════════════════════════════════════════════════════
# Beer Cellar — Deploy script
# Aggiorna version.json e APP_VERSION in sw.js, poi commit & push
# Uso: .\deploy.ps1 "messaggio commit"
# ══════════════════════════════════════════════════════════════

param(
    [string]$Message = "deploy: aggiornamento app"
)

Set-Location $PSScriptRoot

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHHmmss")

# Aggiorna version.json
@"
{
  "version": "$timestamp"
}
"@ | Set-Content -Path "version.json" -Encoding UTF8

# Aggiorna APP_VERSION in sw.js
$sw = Get-Content -Path "sw.js" -Raw -Encoding UTF8
$sw = $sw -replace "const APP_VERSION\s*=\s*'[^']*'", "const APP_VERSION   = 'v$timestamp'"
Set-Content -Path "sw.js" -Value $sw -Encoding UTF8 -NoNewline

Write-Host "Version bumped to: $timestamp" -ForegroundColor Green

# Commit & push
git add -A
git commit -m "$Message"
git push

Write-Host "Deploy completato!" -ForegroundColor Cyan
