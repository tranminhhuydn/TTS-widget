# Register all exported VieNeu voice presets in audio.cpp server.json.
# Compatible with Windows PowerShell 5.1 and PowerShell 7.
# Run this script AFTER stopping the currently running audiocpp_server.exe with Ctrl+C.

[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo",
    [switch]$ConfigureOnly
)

$ErrorActionPreference = "Stop"

$configPath = Join-Path $ModelRoot "server.json"
$voiceRoot = Join-Path $ModelRoot "voices"
$runtimeDir = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cpu-portable"
$serverExe = Join-Path $runtimeDir "audiocpp_server.exe"

if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
    throw "Khong tim thay server.json: $configPath"
}
if (-not (Test-Path -LiteralPath $voiceRoot -PathType Container)) {
    throw "Khong tim thay thu muc voices: $voiceRoot. Hay chay script export voice truoc."
}

# Load the existing configuration without discarding unrelated settings.
$config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$model = @($config.models | Where-Object { $_.id -eq "vieneu" }) | Select-Object -First 1
if ($null -eq $model) {
    throw "Khong tim thay model co id 'vieneu' trong server.json."
}

# Build presets only from folders containing both required VieNeu assets.
$presets = [ordered]@{}
$voiceDirs = @(Get-ChildItem -LiteralPath $voiceRoot -Directory | Sort-Object Name)
foreach ($dir in $voiceDirs) {
    $embedding = Join-Path $dir.FullName "speaker.emb.txt"
    $codes = Join-Path $dir.FullName "ref_codes.txt"

    if ((Test-Path -LiteralPath $embedding -PathType Leaf) -and
        (Test-Path -LiteralPath $codes -PathType Leaf)) {
        $presets[$dir.Name] = @{
            options = @{
                speaker_embedding_file = $embedding.Replace("\", "/")
                reference_codes_file   = $codes.Replace("\", "/")
            }
        }
        Write-Host "OK  $($dir.Name)" -ForegroundColor Green
    }
    else {
        Write-Warning "Bo qua '$($dir.Name)': thieu speaker.emb.txt hoac ref_codes.txt"
    }
}

if ($presets.Count -eq 0) {
    throw "Khong co voice preset hop le. Khong thay doi server.json."
}

$defaultVoice = "pham_tuyen"
if (-not $presets.Contains($defaultVoice)) {
    $defaultVoice = @($presets.Keys)[0]
    Write-Warning "Khong co pham_tuyen; tam chon voice dau tien: $defaultVoice"
}

# Keep a timestamped backup before writing.
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$configPath.$stamp.bak"
Copy-Item -LiteralPath $configPath -Destination $backupPath

# Replace/add the two audio.cpp model properties.
$model | Add-Member -MemberType NoteProperty -Name "voice_presets" -Value $presets -Force
$model | Add-Member -MemberType NoteProperty -Name "default_voice_preset" -Value $defaultVoice -Force

$json = $config | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $json + [Environment]::NewLine, $utf8NoBom)

# Read back the file to catch malformed JSON before starting the server.
$check = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$checkModel = @($check.models | Where-Object { $_.id -eq "vieneu" }) | Select-Object -First 1
$registeredCount = @($checkModel.voice_presets.PSObject.Properties).Count
if ($registeredCount -ne $presets.Count) {
    Copy-Item -LiteralPath $backupPath -Destination $configPath -Force
    throw "Kiem tra lai that bai. Da khoi phuc server.json tu ban sao."
}

Write-Host ""
Write-Host "Da dang ky $registeredCount voice preset." -ForegroundColor Cyan
Write-Host "Voice mac dinh: $defaultVoice"
Write-Host "Config: $configPath"
Write-Host "Backup: $backupPath"
Write-Host ""
Write-Host "Luu y: voice_presets cua audio.cpp truyen cac tuy chon rieng cho tung voice."
Write-Host "Hay kiem tra GET /v1/audio/voices?model=vieneu sau khi server khoi dong."

if ($ConfigureOnly) {
    Write-Host "Chi cap nhat cau hinh; khong khoi dong server do co -ConfigureOnly."
    return
}

if (-not (Test-Path -LiteralPath $serverExe -PathType Leaf)) {
    throw "Da cap nhat server.json nhung khong tim thay audiocpp_server.exe: $serverExe"
}

Write-Host "Dang khoi dong audio.cpp. Giu cua so nay mo; Ctrl+C de dung server." -ForegroundColor Yellow
Set-Location -LiteralPath $runtimeDir
& $serverExe --config $configPath
