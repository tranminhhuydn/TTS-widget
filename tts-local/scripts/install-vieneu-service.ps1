#requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo",
    [string]$ServiceName = "VieNeuTTS"
)
$ErrorActionPreference = "Stop"
$runtime = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cpu-portable"
$serverExe = Join-Path $runtime "audiocpp_server.exe"
$config = Join-Path $ModelRoot "server.json"
$serviceDir = Join-Path $ModelRoot "windows-service"
$nssmExe = Join-Path $serviceDir "nssm.exe"
$logDir = Join-Path $serviceDir "logs"

if (-not (Test-Path -LiteralPath $serverExe)) { throw "Khong tim thay: $serverExe" }
if (-not (Test-Path -LiteralPath $config)) { throw "Khong tim thay: $config" }
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) { throw "Dich vu $ServiceName da ton tai. Hay go dich vu cu truoc." }

New-Item -ItemType Directory -Force -Path $serviceDir, $logDir | Out-Null
if (-not (Test-Path -LiteralPath $nssmExe)) {
    $zipPath = Join-Path $env:TEMP "nssm-2.24.zip"
    $extractPath = Join-Path $env:TEMP "nssm-2.24"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $zipPath -UseBasicParsing
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
    $sourceNssm = Join-Path $extractPath "nssm-2.24\win64\nssm.exe"
    if (-not (Test-Path -LiteralPath $sourceNssm)) { throw "Khong tim thay NSSM win64 trong goi tai ve." }
    Copy-Item -LiteralPath $sourceNssm -Destination $nssmExe -Force
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Host "Dich vu se chay bang tai khoan: $currentUser" -ForegroundColor Cyan
Write-Host "Nhap mat khau tai khoan Windows hien tai (khong luu trong script)."
$securePassword = Read-Host "Mat khau Windows" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $appParameters = '--config "' + $config + '"'
    & $nssmExe install $ServiceName $serverExe $appParameters
    if ($LASTEXITCODE -ne 0) { throw "NSSM install that bai." }
    & $nssmExe set $ServiceName AppDirectory $runtime
    & $nssmExe set $ServiceName ObjectName $currentUser $plainPassword
    & $nssmExe set $ServiceName Start SERVICE_AUTO_START
    & $nssmExe set $ServiceName AppStdout (Join-Path $logDir "stdout.log")
    & $nssmExe set $ServiceName AppStderr (Join-Path $logDir "stderr.log")
    & $nssmExe set $ServiceName AppRotateFiles 1
    & $nssmExe set $ServiceName AppRotateOnline 1
    & $nssmExe set $ServiceName AppExit Default Restart
    & $nssmExe set $ServiceName AppRestartDelay 5000
    if ($LASTEXITCODE -ne 0) { throw "Cau hinh NSSM co loi." }
}
catch {
    & $nssmExe remove $ServiceName confirm 2>$null
    throw
}
finally {
    $plainPassword = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $securePassword.Dispose()
}
Write-Host "Da dang ky dich vu $ServiceName." -ForegroundColor Green
Start-Service -Name $ServiceName
Start-Sleep -Seconds 3
Get-CimInstance Win32_Service -Filter "Name='$ServiceName'" | Select-Object Name, State, StartMode, StartName | Format-Table -AutoSize
Write-Host "API: http://127.0.0.1:8080"
Write-Host "Log: $logDir"
