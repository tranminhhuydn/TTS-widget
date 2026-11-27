[CmdletBinding()]
param(
    [ValidateSet("Start","Stop","Restart","Status")]
    [string]$Action = "Status",
    [string]$ServiceName = "VieNeuTTS"
)
$ErrorActionPreference = "Stop"
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) { throw "Khong tim thay dich vu $ServiceName. Hay chay install-vieneu-service.ps1 truoc." }

switch ($Action) {
    "Start"   { Start-Service -Name $ServiceName; Write-Host "Da gui lenh Start." -ForegroundColor Green }
    "Stop"    { Stop-Service -Name $ServiceName -Force; Write-Host "Da gui lenh Stop." -ForegroundColor Yellow }
    "Restart" { Restart-Service -Name $ServiceName -Force; Write-Host "Da gui lenh Restart." -ForegroundColor Green }
    "Status"  { }
}
Get-CimInstance Win32_Service -Filter "Name='$ServiceName'" |
    Select-Object Name, State, StartMode, StartName, ProcessId |
    Format-List
Write-Host "API: http://127.0.0.1:8080"
