param(
  [string]$ApiBaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"

# Start the Next.js process with these environment values before running this script:
# $env:LOCAL_STORE_DRIVER = "prisma"
# $env:DATABASE_URL = "file:../.data/doganium.sqlite"
# npm.cmd run dev

$payload = @{
  customerPhone = "905367074329"
  tckn = "27136769618"
  plate = "34MYZ039"
  documentSerial = "HV689268"
  birthDate = "25.02.2000"
  rawMessage = "TC 27136769618 Plaka 34MYZ039 Belge HV689268 Dogum 25.02.2000"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiBaseUrl/api/jobs" `
  -ContentType "application/json; charset=utf-8" `
  -Body $payload

$response | ConvertTo-Json -Depth 8
