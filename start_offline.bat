@echo off
title DataClean AI - Offline Launcher
echo ===================================================
echo       DATACLEAN AI - LAUNCHING OFFLINE MODE
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "DataClean AI - Backend Server" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend on http://127.0.0.1:5173 ...
start "DataClean AI - Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul

echo.
echo Opening browser to http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo.
echo ===================================================
echo  Both Backend & Frontend are running locally!
echo  Backend API:  http://127.0.0.1:8000
echo  Frontend App: http://127.0.0.1:5173
echo ===================================================
pause
