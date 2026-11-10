@echo off
echo.
echo  ============================================
echo   SOUL STORE - Starting Frontend (Vite + Tailwind)
echo  ============================================
echo.

node --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  ERROR: Node.js is not installed!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  Installing frontend dependencies...
    call npm.cmd install
)

echo  Starting Vite dev server...
echo  Opening http://localhost:5173
call npm.cmd run dev
