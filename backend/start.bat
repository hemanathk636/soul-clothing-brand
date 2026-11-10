@echo off
echo.
echo  ============================================
echo   SOUL STORE - Starting Backend Server
echo  ============================================
echo.

node --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo  Node.js found:
node --version

if not exist "node_modules" (
    echo.
    echo  Installing dependencies...
    call npm.cmd install
)

echo.
echo  Starting Soul Store server on Port 3000...
echo  Open http://localhost:3000 in your browser
echo.
node server.js
pause
