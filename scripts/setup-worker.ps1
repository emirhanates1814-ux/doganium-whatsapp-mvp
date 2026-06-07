param(
  [string]$ApiBaseUrl = "http://localhost:3000",
  [string]$Mode = "mock"
)

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
      return $parts[1].Trim().Trim('"').Trim("'")
    }
  }

  return $null
}

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env.local"
$settingsPath = Join-Path $root "worker/settings.json"
$examplePath = Join-Path $root "worker/settings.example.json"

if (-not (Test-Path -LiteralPath $settingsPath)) {
  Copy-Item -LiteralPath $examplePath -Destination $settingsPath
}

$workerApiKey = Read-DotEnvValue -Path $envPath -Name "WORKER_API_KEY"
if (-not $workerApiKey) {
  throw "WORKER_API_KEY .env.local içinde bulunamadı."
}

$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
$settings.apiBaseUrl = $ApiBaseUrl
$settings.workerApiKey = $workerApiKey
$settings.mode = $Mode

if (-not $settings.pollIntervalSeconds) {
  $settings | Add-Member -NotePropertyName "pollIntervalSeconds" -NotePropertyValue 5
}

$settings | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $settingsPath -Encoding UTF8
Write-Output "worker/settings.json güncellendi. mode=$Mode apiBaseUrl=$ApiBaseUrl"
