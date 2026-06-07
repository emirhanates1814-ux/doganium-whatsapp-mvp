param(
  [switch]$ListWindows,
  [string]$Title,
  [string]$ProcessName,
  [Alias("Pid")]
  [int]$ProcessId,
  [ValidateSet("uia", "win32")]
  [string]$Backend = "uia",
  [switch]$DumpAll
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $root "worker"
$venvPython = Join-Path $workerDir ".venv\Scripts\python.exe"
$scriptPath = Join-Path $workerDir "inspect_doganium.py"
$requirementsPath = Join-Path $workerDir "requirements.txt"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "inspect_doganium.py bulunamadı: $scriptPath"
}

if (-not (Test-Path -LiteralPath $venvPython)) {
  Write-Output "Worker venv bulunamadı. Oluşturuluyor..."
  python -m venv (Join-Path $workerDir ".venv")
}

& $venvPython -c "import pywinauto" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Output "pywinauto bulunamadı. requirements.txt yükleniyor..."
  & $venvPython -m pip install -r $requirementsPath
}

$argsList = @("inspect_doganium.py", "--backend", $Backend)

if ($ProcessId -gt 0) {
  $argsList += @("--pid", "$ProcessId")
} elseif ($ProcessName) {
  $argsList += @("--process-name", $ProcessName)
} elseif ($Title) {
  $argsList += @("--title", $Title)
} elseif ($DumpAll) {
  $argsList += "--dump-all"
} else {
  $argsList += "--list-windows"
}

Push-Location -LiteralPath $workerDir

try {
  & $venvPython $argsList
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}

exit $exitCode
