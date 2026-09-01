@echo off
title DataClean AI - One-Click Setup
echo ===================================================
echo       DATACLEAN AI - ONE-CLICK INSTALLATION
echo ===================================================
echo.

echo [1/2] Installing Python Backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies. Ensure Python 3.10+ is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing React Frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Node.js dependencies. Ensure Node.js 18+ is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo  INSTALLATION COMPLETE!
echo  You can now double-click "start_offline.bat" to launch!
echo ===================================================
pause
