#requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo",
    [string]$ServiceName = "VieNeuTTS-GPU"
)
$ErrorActionPreference = "Stop"

$runtime = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cuda12.4"
$config = Join-Path $ModelRoot "server-gpu.json"
$launcher = Join-Path $PSScriptRoot "start-vieneu-gpu.ps1"
$serviceDir = Join-Path $ModelRoot "windows-service"
$nssmExe = Join-Path $serviceDir "nssm.exe"
$logDir = Join-Path $serviceDir "gpu-logs"
$powerShellExe = Join-Path $PSHOME "powershell.exe"

if (-not (Test-Path -LiteralPath $config)) {
    throw "Khong tim thay $config. Hay chay install-vieneu-gpu.ps1 truoc."
}
if (-not (Test-Path -LiteralPath $launcher)) {
    throw "Khong tim thay script khoi dong GPU: $launcher"
}
$serverCandidates = @(Get-ChildItem -LiteralPath $runtime -Filter "audiocpp_server.exe" -File -Recurse -ErrorAction SilentlyContinue)
if ($serverCandidates.Count -ne 1) {
    throw "Can dung mot audiocpp_server.exe trong $runtime; tim thay $($serverCandidates.Count)."
}
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    throw "Dich vu $ServiceName da ton tai. Hay dung manage-vieneu-gpu-service.ps1 de kiem tra."
}

New-Item -ItemType Directory -Force -Path $serviceDir, $logDir | Out-Null

if (-not (Test-Path -LiteralPath $nssmExe)) {
    $zipPath = Join-Path $env:TEMP "nssm-2.24.zip"
    $extractPath = Join-Path $env:TEMP "nssm-2.24"
    Write-Host "Dang tai NSSM 2.24..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $zipPath -UseBasicParsing
    if (Test-Path -LiteralPath $extractPath) { Remove-Item -LiteralPath $extractPath -Recurse -Force }
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
    $sourceNssm = Join-Path $extractPath "nssm-2.24\win64\nssm.exe"
    if (-not (Test-Path -LiteralPath $sourceNssm)) { throw "Khong tim thay NSSM win64 trong goi tai ve." }
    Copy-Item -LiteralPath $sourceNssm -Destination $nssmExe -Force
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Host "Dich vu GPU se chay bang tai khoan: $currentUser" -ForegroundColor Cyan
Write-Host "Nhap mat khau tai khoan Windows hien tai (khong luu trong script)."
$securePassword = Read-Host "Mat khau Windows" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$installed = $false
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $launcher + '" -ModelRoot "' + $ModelRoot + '"'

    & $nssmExe install $ServiceName $powerShellExe $arguments
    if ($LASTEXITCODE -ne 0) { throw "NSSM install that bai." }
    $installed = $true

    $settings = @(
        @("AppDirectory", $ModelRoot),
        @("ObjectName", $currentUser, $plainPassword),
        @("Start", "SERVICE_AUTO_START"),
        @("AppStdout", (Join-Path $logDir "stdout.log")),
        @("AppStderr", (Join-Path $logDir "stderr.log")),
        @("AppRotateFiles", "1"),
        @("AppRotateOnline", "1"),
        @("AppRotateBytes", "10485760"),
        @("AppExit", "Default", "Restart"),
        @("AppRestartDelay", "5000"),
        @("AppKillProcessTree", "1")
    )
    foreach ($setting in $settings) {
        & $nssmExe set $ServiceName @setting
        if ($LASTEXITCODE -ne 0) { throw "NSSM khong cau hinh duoc muc $($setting[0])." }
    }
}
catch {
    if ($installed) { & $nssmExe remove $ServiceName confirm 2>$null }
    throw
}
finally {
    $plainPassword = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $securePassword.Dispose()
}

Write-Host "Da dang ky dich vu $ServiceName." -ForegroundColor Green
Start-Service -Name $ServiceName
Start-Sleep -Seconds 5
Get-CimInstance Win32_Service -Filter "Name='$ServiceName'" |
    Select-Object Name, State, StartMode, StartName, ProcessId |
    Format-Table -AutoSize
Write-Host "GPU API: http://127.0.0.1:8081"
Write-Host "CPU API khong thay doi: http://127.0.0.1:8080"
Write-Host "Log GPU: $logDir"
