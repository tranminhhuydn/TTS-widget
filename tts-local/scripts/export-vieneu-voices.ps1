[CmdletBinding()]
param(
    [string]$SourceJson = "D:\dev\python\VieNeu-TTS\VieNeu-TTS\src\vieneu\assets\voices_v3_turbo.json",
    [string]$OutputRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\voices"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $SourceJson)) { throw "Khong tim thay file: $SourceJson" }
$jsonText = [System.IO.File]::ReadAllText($SourceJson, [System.Text.Encoding]::UTF8)
$data = $jsonText | ConvertFrom-Json
if (-not $data.presets) { throw "JSON khong co object 'presets'." }

function ConvertTo-SafeFolderName([string]$Name) {
    $normalized = $Name.Normalize([Text.NormalizationForm]::FormD)
    $builder = New-Object System.Text.StringBuilder
    foreach ($ch in $normalized.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($ch)
        }
    }
    $slug = $builder.ToString().Normalize([Text.NormalizationForm]::FormC)
    $slug = $slug.Replace("đ","d").Replace("Đ","D").ToLowerInvariant()
    $slug = [regex]::Replace($slug, "[^a-z0-9]+", "_").Trim("_")
    if ([string]::IsNullOrWhiteSpace($slug)) { $slug = "voice" }
    return $slug
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$exported = 0
foreach ($property in $data.presets.PSObject.Properties) {
    $voiceName = $property.Name
    $voice = $property.Value
    if (-not $voice.speaker_emb -or -not $voice.codes) {
        Write-Warning "Bo qua '$voiceName': thieu speaker_emb hoac codes."
        continue
    }
    $folder = Join-Path $OutputRoot (ConvertTo-SafeFolderName $voiceName)
    [void][System.IO.Directory]::CreateDirectory($folder)
    $embedding = @($voice.speaker_emb)
    $embeddingText = ($embedding | ForEach-Object { [Convert]::ToString($_, [Globalization.CultureInfo]::InvariantCulture) }) -join ","
    [System.IO.File]::WriteAllText((Join-Path $folder "speaker.emb.txt"), $embeddingText, $utf8NoBom)
    $frames = @($voice.codes)
    $lines = foreach ($frame in $frames) {
        (@($frame) | ForEach-Object { [Convert]::ToString($_, [Globalization.CultureInfo]::InvariantCulture) }) -join " "
    }
    [System.IO.File]::WriteAllLines((Join-Path $folder "ref_codes.txt"), [string[]]$lines, $utf8NoBom)
    $exported++
    Write-Host ("Da xuat: {0} -> {1}" -f $voiceName, $folder)
}
Write-Host ""
Write-Host ("Hoan tat: {0} voice duoc xuat vao {1}" -f $exported, $OutputRoot)
