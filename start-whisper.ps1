# Starts the Cardinal Whisper STT service (background) with AboveNormal
# priority so transcription wins the CPU over background tabs and tools.
# Usage: right-click -> Run with PowerShell, or:
#   powershell -ExecutionPolicy Bypass -File start-whisper.ps1
# Stop it with: Stop-Process -Name python (check first: Get-Process python)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'whisper-service')

$existing = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($existing) {
  Write-Output 'Whisper already running on :8001. Stop it first if you want a fresh start.'
  exit 0
}

$p = Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList 'app.py' `
  -WorkingDirectory (Join-Path $PSScriptRoot 'whisper-service') `
  -WindowStyle Hidden -PassThru
$p.PriorityClass = 'AboveNormal'
Write-Output "Whisper started (pid $($p.Id), priority AboveNormal). Waiting for models..."

for ($i = 0; $i -lt 24; $i++) {
  Start-Sleep -Seconds 5
  try {
    $h = curl.exe -s http://127.0.0.1:8001/health --max-time 5 | ConvertFrom-Json
    if ($h.status -eq 'ok' -and $h.loaded -contains 'small') {
      Write-Output "Ready: model=$($h.model) threads=$($h.threads) beam=$($h.beam)."
      exit 0
    }
  } catch {}
}
Write-Output 'Still starting — check health manually: curl.exe -s http://127.0.0.1:8001/health'
