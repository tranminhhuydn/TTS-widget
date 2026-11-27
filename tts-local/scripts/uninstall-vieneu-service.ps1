#requires -RunAsAdministrator
[CmdletBinding()]
param([string]$ServiceName = "VieNeuTTS")
$ErrorActionPreference = "Stop"
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Dich vu $ServiceName chua duoc cai dat."
    exit 0
}
$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo"
$nssmExe = Join-Path $ModelRoot "windows-service\nssm.exe"
if (-not (Test-Path -LiteralPath $nssmExe)) {
    throw "Khong tim thay NSSM tai $nssmExe. Hay kiem tra va go dich vu bang cong cu Services."
}
if ($service.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force
    $service.WaitForStatus("Stopped", [TimeSpan]::FromSeconds(30))
}
& $nssmExe remove $ServiceName confirm
if ($LASTEXITCODE -ne 0) { throw "NSSM khong go duoc dich vu." }
Write-Host "Da go dich vu $ServiceName. Log va NSSM van duoc giu lai trong windows-service." -ForegroundColor Green
