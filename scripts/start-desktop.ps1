param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name bulunamadı. Lütfen PATH ayarını kontrol edin."
  }
}

function Wait-HttpReady {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  throw "Next.js dev server $TimeoutSeconds saniye içinde hazır olmadı."
}

function Get-PortProcessId {
  param([Parameter(Mandatory = $true)][int]$LocalPort)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $LocalPort -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($connection) {
    return [int]$connection.OwningProcess
  }

  return $null
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$desktopDir = Join-Path $root ".desktop"
$logsDir = Join-Path $root "logs"
$workerLogsDir = Join-Path $root "worker\logs"
$pidPath = Join-Path $desktopDir "desktop-pids.json"
$dashboardUrl = "http://localhost:$Port"
$workerExePath = Join-Path $root "worker\dist\DoganiumWorker.exe"

New-Item -ItemType Directory -Force -Path $desktopDir, $logsDir, $workerLogsDir | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $root ".env.local"))) {
  throw ".env.local bulunamadı. Önce .env.example dosyasından .env.local oluşturup değerleri doldurun."
}

Assert-Command -Name "npm.cmd"

if (-not (Test-Path -LiteralPath (Join-Path $root "worker\settings.json"))) {
  & (Join-Path $root "scripts\setup-worker.ps1") -ApiBaseUrl $dashboardUrl -Mode "mock"
}

if (-not (Test-Path -LiteralPath $workerExePath)) {
  throw "worker/dist/DoganiumWorker.exe bulunamadı. Önce worker EXE build edin."
}

if (-not (Test-Path -LiteralPath (Join-Path $root "node_modules"))) {
  Write-Output "node_modules bulunamadı. npm install çalıştırılıyor..."
  npm install
}

$nextManaged = $false
$nextLauncherPid = $null
$nextPortPid = Get-PortProcessId -LocalPort $Port

if ($nextPortPid) {
  Write-Output "Port $Port zaten dinleniyor. Mevcut Next.js süreci kullanılacak. PID: $nextPortPid"
} else {
  Write-Output "Next.js dev server başlatılıyor..."
  $nextOutLog = Join-Path $logsDir "next.out.log"
  $nextErrLog = Join-Path $logsDir "next.err.log"
  $nextProcess = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "-p", "$Port") `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $nextOutLog `
    -RedirectStandardError $nextErrLog `
    -PassThru

  $nextManaged = $true
  $nextLauncherPid = $nextProcess.Id
}

Write-Output "Next.js hazır olması bekleniyor: $dashboardUrl"
Wait-HttpReady -Url $dashboardUrl -TimeoutSeconds 90
$nextPortPid = Get-PortProcessId -LocalPort $Port

Write-Output "DoganiumWorker.exe başlatılıyor..."
$workerOutLog = Join-Path $workerLogsDir "worker.out.log"
$workerErrLog = Join-Path $workerLogsDir "worker.err.log"
$workerProcess = Start-Process `
  -FilePath $workerExePath `
  -WorkingDirectory (Join-Path $root "worker") `
  -WindowStyle Hidden `
  -RedirectStandardOutput $workerOutLog `
  -RedirectStandardError $workerErrLog `
  -PassThru

$state = [ordered]@{
  root = $root
  dashboardUrl = $dashboardUrl
  nextManaged = $nextManaged
  nextLauncherPid = $nextLauncherPid
  nextPortPid = $nextPortPid
  workerPid = $workerProcess.Id
  workerExe = $workerExePath
  startedAt = (Get-Date).ToString("o")
  logs = [ordered]@{
    nextOut = Join-Path $logsDir "next.out.log"
    nextErr = Join-Path $logsDir "next.err.log"
    workerOut = $workerOutLog
    workerErr = $workerErrLog
  }
}

$state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $pidPath -Encoding UTF8

Start-Process $dashboardUrl

Write-Output ""
Write-Output "Doganium WhatsApp MVP çalışıyor."
Write-Output "Dashboard: $dashboardUrl"
Write-Output "Next launcher PID: $nextLauncherPid"
Write-Output "Next port PID: $nextPortPid"
Write-Output "Worker EXE PID: $($workerProcess.Id)"
Write-Output "PID dosyası: $pidPath"
