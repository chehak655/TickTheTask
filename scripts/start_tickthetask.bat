@echo off
title TickTheTask Service Launcher
echo ===================================================
echo           Starting TickTheTask Services
echo ===================================================

echo [1/3] Starting MySQL Database Server...
start "TickTheTask MySQL Server" /min "C:\Program Files\MySQL\MySQL Server 9.2\bin\mysqld.exe" --datadir="C:\Users\Chehak\mysql_data" --port=3306 --console

echo [2/3] Starting FastAPI Backend (Port 8000)...
cd /d "%~dp0backend"
start "TickTheTask Backend API" /min cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [3/3] Starting Vite Web Frontend (Port 5173)...
cd /d "%~dp0web"
start "TickTheTask Web Frontend" /min cmd /k "npm run dev -- --host 0.0.0.0"

echo ===================================================
echo   TickTheTask is now running!
echo   - Local PC:   http://localhost:5173
echo   - Other Devices / Phones (Wi-Fi): Use your PC's local IP address (e.g., http://192.168.x.x:5173)
echo   - API Docs:   http://localhost:8000/docs
echo ===================================================
timeout /t 5
