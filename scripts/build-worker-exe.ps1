$ErrorActionPreference = "Stop"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name bulunamadı. Lütfen PATH ayarını kontrol edin."
  }
}

$root = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $root "worker"
$venvPath = Join-Path $workerDir ".venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"
$buildPath = Join-Path $workerDir "build"
$distPath = Join-Path $workerDir "dist"
$exePath = Join-Path $distPath "DoganiumWorker.exe"

Assert-Command -Name "python"

if (-not (Test-Path -LiteralPath $pythonPath)) {
  Write-Output "Worker venv bulunamadı. Oluşturuluyor..."
  python -m venv $venvPath
}

Write-Output "Worker requirements yükleniyor..."
& $pythonPath -m pip install -r (Join-Path $workerDir "requirements.txt")

Write-Output "PyInstaller yükleniyor..."
& $pythonPath -m pip install pyinstaller

if (Test-Path -LiteralPath $buildPath) {
  Write-Output "Eski worker/build çıktısı temizleniyor..."
  Remove-Item -LiteralPath $buildPath -Recurse -Force
}

if (Test-Path -LiteralPath $distPath) {
  Write-Output "Eski worker/dist çıktısı temizleniyor..."
  Remove-Item -LiteralPath $distPath -Recurse -Force
}

$specPath = Join-Path $workerDir "DoganiumWorker.spec"
if (Test-Path -LiteralPath $specPath) {
  Remove-Item -LiteralPath $specPath -Force
}

Write-Output "DoganiumWorker.exe build ediliyor..."
& $pythonPath -m PyInstaller --onefile --name DoganiumWorker main.py --distpath $distPath --workpath $buildPath --specpath $workerDir

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "EXE build tamamlandı ama worker/dist/DoganiumWorker.exe bulunamadı."
}

Write-Output "Worker EXE hazır: $exePath"
