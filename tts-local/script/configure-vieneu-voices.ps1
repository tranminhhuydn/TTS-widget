[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo",
    [string]$ModelId = "vieneu",
    [string]$DefaultVoice = "pham_tuyen"
)

$ErrorActionPreference = "Stop"

$configPath = Join-Path $ModelRoot "server.json"
$voicesRoot = Join-Path $ModelRoot "voices"

if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
    throw "Khong tim thay server.json: $configPath"
}
if (-not (Test-Path -LiteralPath $voicesRoot -PathType Container)) {
    throw "Khong tim thay thu muc voices: $voicesRoot. Hay chay script export voice truoc."
}

# Parse config before making any changes.
$configText = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
$config = $configText | ConvertFrom-Json

$model = @($config.models) | Where-Object { $_.id -eq $ModelId } | Select-Object -First 1
if ($null -eq $model) {
    throw "Khong tim thay model id '$ModelId' trong server.json."
}

# Build named presets from folders containing both VieNeu voice assets.
$presets = [ordered]@{}
$voiceFolders = @(Get-ChildItem -LiteralPath $voicesRoot -Directory)

foreach ($folder in $voiceFolders) {
    $embeddingPath = Join-Path $folder.FullName "speaker.emb.txt"
    $codesPath = Join-Path $folder.FullName "ref_codes.txt"

    if ((Test-Path -LiteralPath $embeddingPath -PathType Leaf) -and
        (Test-Path -LiteralPath $codesPath -PathType Leaf)) {

        $voiceId = $folder.Name
        $presets[$voiceId] = @{
            options = @{
                speaker_embedding_file = [System.IO.Path]::GetFullPath($embeddingPath).Replace("\", "/")
                reference_codes_file = [System.IO.Path]::GetFullPath($codesPath).Replace("\", "/")
            }
        }
        Write-Host "OK  $voiceId" -ForegroundColor Green
    }
    else {
        Write-Warning "Bo qua '$($folder.Name)': thieu speaker.emb.txt hoac ref_codes.txt"
    }
}

if ($presets.Count -eq 0) {
    throw "Khong co voice nao co du ca speaker.emb.txt va ref_codes.txt. Khong sua server.json."
}
if (-not $presets.Contains($DefaultVoice)) {
    $available = ($presets.Keys -join ", ")
    throw "Khong tim thay voice mac dinh '$DefaultVoice'. Voice hop le: $available"
}

# Add/replace the model-level preset properties without disturbing other settings.
$model | Add-Member -MemberType NoteProperty -Name "voice_presets" -Value $presets -Force
$model | Add-Member -MemberType NoteProperty -Name "default_voice_preset" -Value $DefaultVoice -Force

# Serialize and validate the resulting JSON before writing.
$newJson = $config | ConvertTo-Json -Depth 100
$null = $newJson | ConvertFrom-Json

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$configPath.backup-$timestamp"
Copy-Item -LiteralPath $configPath -Destination $backupPath

# Write UTF-8 without BOM for compatibility with JSON parsers.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $newJson, $utf8NoBom)

Write-Host ""
Write-Host "Da dang ky $($presets.Count) voice preset cho model '$ModelId'." -ForegroundColor Cyan
Write-Host "Voice mac dinh: $DefaultVoice"
Write-Host "Config: $configPath"
Write-Host "Backup: $backupPath"
Write-Host ""
Write-Host "Buoc tiep theo: dung audio.cpp server (Ctrl+C), sau do khoi dong lai bang lenh --config server.json."
