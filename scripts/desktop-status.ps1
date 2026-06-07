$ErrorActionPreference = "Stop"

function Read-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $parts = $trimmed -split "=", 2
    if ($parts.Length -eq 2 -and $parts[0].Trim() -eq $Name) {
      $value = $parts[1].Trim().Trim('"').Trim("'")
      if ($value.Length -gt 0) {
        return $value
      }
    }
  }

  return $null
}

function Test-ProcessId {
  param([AllowNull()][object]$PidValue)

  if ($null -eq $PidValue -or "$PidValue".Trim().Length -eq 0) {
    return $false
  }

  return $null -ne (Get-Process -Id ([int]$PidValue) -ErrorAction SilentlyContinue)
}

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env.local"
$settingsPath = Join-Path $root "worker\settings.json"
$pidPath = Join-Path $root ".desktop\desktop-pids.json"

$nextConnection = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object -First 1

Write-Output "Desktop MVP durumu"
Write-Output "------------------"

if ($nextConnection) {
  Write-Output "Next.js: çalışıyor (port 3000, PID $($nextConnection.OwningProcess))"
} else {
  Write-Output "Next.js: çalışmıyor (port 3000 boş)"
}

if (Test-Path -LiteralPath $pidPath) {
  $state = Get-Content -LiteralPath $pidPath -Raw | ConvertFrom-Json
  if (Test-ProcessId -PidValue $state.workerPid) {
    Write-Output "Worker: çalışıyor (PID $($state.workerPid))"
  } else {
    Write-Output "Worker: PID dosyasında kayıt var ama süreç çalışmıyor"
  }
} else {
  Write-Output "Worker: PID dosyası yok"
}

Write-Output "worker/settings.json: $(if (Test-Path -LiteralPath $settingsPath) { 'var' } else { 'yok' })"
Write-Output ".env.local: $(if (Test-Path -LiteralPath $envPath) { 'var' } else { 'yok' })"

$envChecks = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WORKER_API_KEY",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID"
)

Write-Output ""
Write-Output "Env kontrolü:"
foreach ($name in $envChecks) {
  $value = Read-DotEnvValue -Path $envPath -Name $name
  $status = if ($value) { "dolu" } else { "eksik" }
  Write-Output "- ${name}: $status"
}
