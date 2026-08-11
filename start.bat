@echo off
title DataClean AI — Launcher
color 0A

echo.
echo  ██████╗  █████╗ ████████╗ █████╗  ██████╗██╗     ███████╗ █████╗ ███╗   ██╗
echo  ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║
echo  ██║  ██║███████║   ██║   ███████║██║     ██║     █████╗  ███████║██╔██╗ ██║
echo  ██║  ██║██╔══██║   ██║   ██╔══██║██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║
echo  ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╗███████╗███████╗██║  ██║██║ ╚████║
echo  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
echo.
echo  AI-Powered Data Cleaning ^& Imputation Recommendation Engine v1.0.0
echo  ======================================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo  [1/3] Checking backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt --quiet 2>nul
echo  [OK] Backend dependencies ready

echo  [2/3] Starting FastAPI backend on port 8000...
start "DataClean AI — Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --port 8000 --host 0.0.0.0"

:: Wait for backend to start
timeout /t 4 /nobreak >nul

echo  [3/3] Starting React frontend on port 5173...
start "DataClean AI — Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 5173 --host"

timeout /t 4 /nobreak >nul

echo.
echo  ======================================================================
echo  [SYSTEM ONLINE]
echo.
echo   Backend  API:  http://localhost:8000
echo   API Docs:      http://localhost:8000/docs
echo   Frontend App:  http://localhost:5173
echo.
echo  Opening browser in 3 seconds...
echo  ======================================================================
timeout /t 3 /nobreak >nul
start "" http://localhost:5173

echo.
echo  Press any key to close this launcher (servers will keep running)...
pause >nul
