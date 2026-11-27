[CmdletBinding()]
param(
    [string]$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo",
    [string]$RuntimeName = "audio-v0.9.6-bin-windows-x64-cuda12.4",
    [switch]$SkipDownload
)
$ErrorActionPreference = "Stop"

$runtime = Join-Path $ModelRoot $RuntimeName
$downloadDir = Join-Path $ModelRoot "gpu-downloads"
$binZip = Join-Path $downloadDir "audio-v0.9.6-bin-windows-x64-cuda12.4.zip"
$cudartZip = Join-Path $downloadDir "audio-v0.9.6-cudart-windows-x64-cuda12.4.zip"
$binUrl = "https://github.com/0xShug0/audio.cpp/releases/download/v0.9.6/audio-v0.9.6-bin-windows-x64-cuda12.4.zip"
$cudartUrl = "https://github.com/0xShug0/audio.cpp/releases/download/v0.9.6/audio-v0.9.6-cudart-windows-x64-cuda12.4.zip"
$expectedBinHash = "ff7783e29b02e9006fa4304b9cdeffa030cd5a184998090f769f0a1d221b2698"
$expectedCudartHash = "283fbf6927021b8e73cd22e6c3c300c2d12adb66361bc1d392401e1ca2759297"
$cpuRuntime = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cpu-portable"
$cpuG2pDll = Join-Path $cpuRuntime "sea_g2p_rs.dll"
$configPath = Join-Path $ModelRoot "server-gpu.json"

if (-not (Test-Path -LiteralPath (Join-Path $ModelRoot "server.json"))) {
    throw "Khong tim thay server.json CPU. Hay kiem tra ModelRoot: $ModelRoot"
}
if (-not (Test-Path -LiteralPath $cpuG2pDll)) {
    throw "Khong tim thay SEA-G2P DLL trong runtime CPU: $cpuG2pDll"
}
if ((Test-Path -LiteralPath $runtime) -and (Test-Path -LiteralPath (Join-Path $runtime "audiocpp_server.exe"))) {
    Write-Host "Runtime CUDA da ton tai: $runtime" -ForegroundColor Yellow
} else {
    if ($SkipDownload) { throw "Runtime CUDA chua co. Bo -SkipDownload de tai goi." }
    New-Item -ItemType Directory -Force -Path $downloadDir, $runtime | Out-Null

    if (-not (Test-Path -LiteralPath $binZip)) {
        Write-Host "Dang tai CUDA binary (~471 MB)..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $binUrl -OutFile $binZip -UseBasicParsing
    }
    if (-not (Test-Path -LiteralPath $cudartZip)) {
        Write-Host "Dang tai CUDA runtime libraries (~607 MB)..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $cudartUrl -OutFile $cudartZip -UseBasicParsing
    }

    $binHash = (Get-FileHash -LiteralPath $binZip -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($binHash -ne $expectedBinHash) { throw "SHA256 CUDA binary khong khop. File tai ve co the bi loi." }
    $cudartHash = (Get-FileHash -LiteralPath $cudartZip -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($cudartHash -ne $expectedCudartHash) { throw "SHA256 CUDA runtime khong khop. File tai ve co the bi loi." }

    Write-Host "Dang giai nen CUDA binary..." -ForegroundColor Cyan
    Expand-Archive -LiteralPath $binZip -DestinationPath $runtime -Force
    Write-Host "Dang giai nen CUDA runtime..." -ForegroundColor Cyan
    Expand-Archive -LiteralPath $cudartZip -DestinationPath $runtime -Force
}

$serverCandidates = @(Get-ChildItem -LiteralPath $runtime -Filter "audiocpp_server.exe" -File -Recurse)
if ($serverCandidates.Count -ne 1) {
    throw "Can tim thay dung mot audiocpp_server.exe trong $runtime; tim thay $($serverCandidates.Count)."
}
$serverExe = $serverCandidates[0].FullName
$runtimeDir = Split-Path -Parent $serverExe

$cudaDll = Get-ChildItem -LiteralPath $runtime -Filter "ggml-cuda.dll" -File -Recurse | Select-Object -First 1
if (-not $cudaDll) { throw "Khong tim thay ggml-cuda.dll trong goi CUDA. Runtime khong day du." }

Copy-Item -LiteralPath $cpuG2pDll -Destination (Join-Path $runtimeDir "sea_g2p_rs.dll") -Force

$serverConfig = Get-Content -LiteralPath (Join-Path $ModelRoot "server.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$serverConfig.backend = "cuda"
$serverConfig.port = 8081
foreach ($model in $serverConfig.models) {
    if ($model.session_options) {
        $model.session_options.'vieneu_v3_turbo.g2p_library' = (Join-Path $runtimeDir "sea_g2p_rs.dll").Replace("\", "/")
    }
}
$configJson = $serverConfig | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $configJson + [Environment]::NewLine, $utf8NoBom)

Write-Host ""
Write-Host "Da chuan bi runtime CUDA." -ForegroundColor Green
Write-Host "Runtime : $runtimeDir"
Write-Host "Config  : $configPath"
Write-Host "API GPU : http://127.0.0.1:8081"
Write-Host "API CPU : http://127.0.0.1:8080 (giu nguyen)"
Write-Host ""
Write-Host "Chua thay doi Windows Service CPU. Hay chay start-vieneu-gpu.ps1 de kiem tra GPU truoc."
