# CyberSphere Defense 3D - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     CYBERSPHERE DEFENSE 3D - SYSTEM INITIALIZATION     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

Write-Host "[*] Starting Python ML Backend on port 8000..." -ForegroundColor Gray
if (Test-Path "$scriptDir\venv\Scripts\python.exe") {
    Start-Process "$scriptDir\venv\Scripts\python.exe" -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $scriptDir -WindowStyle Minimized
} else {
    Start-Process "python" -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $scriptDir -WindowStyle Minimized
}

Write-Host "[*] Starting Frontend Web Server on port 5500..." -ForegroundColor Gray
Start-Process "python" -ArgumentList "-m http.server 5500" -WorkingDirectory $scriptDir -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "[*] Opening Dashboard in default browser..." -ForegroundColor Gray
Start-Process "http://localhost:5500"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  CYBERSPHERE DEFENSE 3D IS RUNNING!" -ForegroundColor Green
Write-Host "  Dashboard:  http://localhost:5500" -ForegroundColor Yellow
Write-Host "  ML Backend: http://127.0.0.1:8000/health" -ForegroundColor Yellow
Write-Host "  Mobile LAN: http://192.168.0.111:5500" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Green
