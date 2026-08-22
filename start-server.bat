@echo off
title Hollywood Clinic - Local Server
color 0E

echo.
echo  ============================================================
echo                Hollywood Clinic - Local Server
echo  ============================================================
echo.

REM Try Python (most likely to be installed on Windows 10/11)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Python detected
    echo.
    echo  Starting server at http://localhost:8000
    echo.
    echo  Your browser will open automatically.
    echo  Press Ctrl+C in this window to stop the server.
    echo.
    echo  ============================================================
    echo.
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:8000"
    python -m http.server 8000
    goto :end
)

REM Try Node.js as fallback
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js detected
    echo.
    echo  Starting server at http://localhost:3000
    echo.
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:3000"
    npx serve -p 3000 .
    goto :end
)

REM Try PHP as last resort
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  [OK] PHP detected
    echo.
    echo  Starting server at http://localhost:8000
    echo.
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:8000"
    php -S localhost:8000
    goto :end
)

REM Nothing found
echo  [ERROR] No server tool detected on your system.
echo.
echo  Please install ONE of these (Python is easiest):
echo.
echo    Python (RECOMMENDED):  https://www.python.org/downloads/
echo                           IMPORTANT: Check "Add Python to PATH"
echo                           during installation.
echo.
echo    Node.js:               https://nodejs.org/
echo.
echo  After installing, double-click this file again.
echo.
echo  ============================================================
echo.
pause

:end
