$ErrorActionPreference = "Stop"

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

  if (-not $isAdmin) {
    throw "Doganium otomasyonu için VS Code/PowerShell yönetici olarak çalışmalı."
  }
}

$root = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $root "worker"
$pythonPath = Join-Path $workerDir ".venv\Scripts\python.exe"

Assert-Admin

if (-not (Test-Path -LiteralPath $pythonPath)) {
  throw "worker/.venv bulunamadı. Önce worker ortamını kurun veya .\scripts\build-worker-exe.ps1 çalıştırın."
}

Push-Location -LiteralPath $workerDir

try {
  & $pythonPath "smoke_doganium_window.py"
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}

exit $exitCode
