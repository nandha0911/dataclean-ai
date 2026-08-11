@echo off
title DataClean AI — Stop All Servers
echo Stopping DataClean AI servers...
taskkill /f /im uvicorn.exe /t 2>nul
taskkill /f /im node.exe /t 2>nul
echo Done. All servers stopped.
timeout /t 2 /nobreak >nul
