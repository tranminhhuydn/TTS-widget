param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$Model = "vieneu",
    [string]$Voice = "doan_trang",
    [string]$InputText = "Xin chào! Tôi là giọng Đoàn Trang của VieNeu TTS. Đây là đoạn thử nghiệm để kiểm tra khả năng chuyển đổi giọng đọc.",
    [string]$OutputFile = "$env:USERPROFILE\test-vieneu-doan-trang.wav"
)

$ErrorActionPreference = "Stop"
$uri = "$($BaseUrl.TrimEnd('/'))/v1/audio/speech"

$body = @{
    model = $Model
    input = $InputText
    voice = $Voice
    response_format = "wav"
} | ConvertTo-Json -Depth 5 -Compress

# Gui byte UTF-8 de tuong thich Windows PowerShell 5.1 va tranh loi encoding tieng Viet.
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Write-Host "Dang gui yeu cau TTS..." -ForegroundColor Cyan
Write-Host "Model : $Model"
Write-Host "Voice : $Voice"
Write-Host "Text  : $InputText"
Write-Host "URL   : $uri"

try {
    Invoke-WebRequest -Uri $uri -Method Post -ContentType "application/json; charset=utf-8" -Body $bodyBytes -OutFile $OutputFile -UseBasicParsing

    if (-not (Test-Path -LiteralPath $OutputFile)) {
        throw "Khong tim thay file WAV sau khi goi API."
    }

    $file = Get-Item -LiteralPath $OutputFile
    if ($file.Length -lt 44) {
        throw "File WAV qua nho ($($file.Length) bytes), co the API khong tra ve audio hop le."
    }

    $stream = [System.IO.File]::OpenRead($OutputFile)
    try {
        $header = New-Object byte[] 4
        [void]$stream.Read($header, 0, 4)
        $riff = [System.Text.Encoding]::ASCII.GetString($header)
    }
    finally {
        $stream.Dispose()
    }

    if ($riff -ne "RIFF") {
        throw "Phan hoi khong co header WAV/RIFF hop le. Hay kiem tra file: $OutputFile"
    }

    Write-Host ""
    Write-Host "TAO AUDIO THANH CONG" -ForegroundColor Green
    Write-Host "File      : $($file.FullName)"
    Write-Host "Dung luong: $($file.Length) bytes"
    Write-Host "Dang mo file de nghe..."

    Start-Process -FilePath $file.FullName
}
catch {
    Write-Host ""
    Write-Host "LOI KHI TAO AUDIO" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    if ($_.Exception.Response) {
        try {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $detail = $reader.ReadToEnd()
            $reader.Dispose()
            if ($detail) {
                Write-Host $detail -ForegroundColor Yellow
            }
        }
        catch {
            # Khong co noi dung loi HTTP de hien thi.
        }
    }

    exit 1
}
