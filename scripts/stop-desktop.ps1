$ErrorActionPreference = "Stop"

function Stop-ProcessIfRunning {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [AllowNull()][object]$PidValue
  )

  if ($null -eq $PidValue -or "$PidValue".Trim().Length -eq 0) {
    return
  }

  $processId = [int]$PidValue
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if (-not $process) {
    Write-Output "$Label zaten çalışmıyor. PID: $processId"
    return
  }

  Stop-Process -Id $processId -Force
  Write-Output "$Label kapatıldı. PID: $processId"
}

$root = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $root ".desktop\desktop-pids.json"

if (-not (Test-Path -LiteralPath $pidPath)) {
  Write-Output "PID dosyası bulunamadı. Çalışan desktop launcher kaydı yok."
  return
}

$state = Get-Content -LiteralPath $pidPath -Raw | ConvertFrom-Json

Stop-ProcessIfRunning -Label "Worker" -PidValue $state.workerPid

if ($state.nextManaged) {
  Stop-ProcessIfRunning -Label "Next.js port süreci" -PidValue $state.nextPortPid
  Stop-ProcessIfRunning -Label "Next.js launcher" -PidValue $state.nextLauncherPid
} else {
  Write-Output "Next.js bu launcher tarafından başlatılmamış; kapatılmadı."
}

Remove-Item -LiteralPath $pidPath -Force
Write-Output "Desktop PID dosyası temizlendi."
