$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $projectRoot ".data"

if (-not (Test-Path -LiteralPath $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

Push-Location $projectRoot
try {
  $env:DATABASE_URL = "file:../.data/doganium.sqlite"

  npx prisma generate
  npx prisma migrate dev --name init_local_sqlite
}
finally {
  Pop-Location
}
