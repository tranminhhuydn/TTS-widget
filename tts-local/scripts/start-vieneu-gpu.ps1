[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo"
)
$ErrorActionPreference = "Stop"
$config = Join-Path $ModelRoot "server-gpu.json"
$runtime = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cuda12.4"

if (-not (Test-Path -LiteralPath $config)) {
    throw "Chua co server-gpu.json. Hay chay install-vieneu-gpu.ps1 truoc."
}
$serverCandidates = @(Get-ChildItem -LiteralPath $runtime -Filter "audiocpp_server.exe" -File -Recurse)
if ($serverCandidates.Count -ne 1) {
    throw "Khong tim thay duy nhat audiocpp_server.exe trong $runtime."
}
$serverExe = $serverCandidates[0].FullName
$runtimeDir = Split-Path -Parent $serverExe
# CUDA archives may place dependent DLLs in nested bin/lib folders.
$runtimeDllDirs = @($runtimeDir) + @(
    Get-ChildItem -LiteralPath $runtime -Directory -Recurse |
        ForEach-Object { $_.FullName }
)
$env:PATH = (($runtimeDllDirs | Select-Object -Unique) -join ";") + ";" + $env:PATH

Write-Host "Starting VieNeu GPU API at http://127.0.0.1:8081" -ForegroundColor Cyan
Write-Host "CPU API on port 8080 is not changed."
Set-Location $runtimeDir
& $serverExe --config $config
