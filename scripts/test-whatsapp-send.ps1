param(
  [Parameter(Mandatory = $true)][string]$To,
  [Parameter(Mandatory = $true)][string]$Message
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
$accessToken = Read-DotEnvValue -Path $envPath -Name "WHATSAPP_ACCESS_TOKEN"
$phoneNumberId = Read-DotEnvValue -Path $envPath -Name "WHATSAPP_PHONE_NUMBER_ID"
$graphVersion = Read-DotEnvValue -Path $envPath -Name "WHATSAPP_GRAPH_API_VERSION"

if (-not $accessToken) {
  throw "WHATSAPP_ACCESS_TOKEN .env.local içinde bulunamadı."
}

if (-not $phoneNumberId) {
  throw "WHATSAPP_PHONE_NUMBER_ID .env.local içinde bulunamadı."
}

if (-not $graphVersion) {
  $graphVersion = "v21.0"
}

$payload = @{
  messaging_product = "whatsapp"
  recipient_type = "individual"
  to = $To
  type = "text"
  text = @{
    preview_url = $false
    body = $Message
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  "Authorization" = "Bearer $accessToken"
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://graph.facebook.com/$graphVersion/$phoneNumberId/messages" `
  -Headers $headers `
  -Body $payload

Write-Output "WhatsApp test mesajı gönderildi. response id: $($response.messages[0].id)"
