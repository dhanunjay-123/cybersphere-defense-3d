@echo off
title CyberSphere Defense 3D Launcher
echo ========================================================
echo      CYBERSPHERE DEFENSE 3D - SYSTEM INITIALIZATION
echo ========================================================
echo.

cd /d "%~dp0"

echo [*] Starting Python ML Backend (Port 8000)...
if exist "venv\Scripts\python.exe" (
    start "CyberSphere-Backend" /min cmd /c "venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
) else (
    start "CyberSphere-Backend" /min cmd /c "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
)

echo [*] Starting Frontend Server (Port 5500)...
start "CyberSphere-Frontend" /min cmd /c "python -m http.server 5500"

echo [*] Launching Dashboard in default browser...
timeout /t 2 /nobreak >nul
start http://localhost:5500

echo.
echo ========================================================
echo   CYBERSPHERE DEFENSE 3D IS RUNNING!
echo   Dashboard: http://localhost:5500
echo   ML Backend: http://127.0.0.1:8000/health
echo   Mobile LAN: http://192.168.0.111:5500
echo ========================================================
echo.
echo Leave this window open while using the application.
echo Press any key to stop all CyberSphere servers...
pause >nul

echo Stopping servers...
taskkill /F /FI "WINDOWTITLE eq CyberSphere-*" >nul 2>&1
echo Servers stopped safely.
timeout /t 2 >nul
