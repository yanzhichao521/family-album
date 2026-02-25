@echo off
chcp 65001 >nul 2>&1
cls

echo ========================================
echo   FamilyAlbum - Free Family Photo Album
echo ========================================
echo.

echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python installed

echo.
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

echo.
echo [3/4] Starting backend...
cd backend
if not exist "static\uploads" mkdir static\uploads
if not exist "familyalbum.db" (
    echo First run - initializing database...
    pip install -r requirements.txt -q
    python init_db.py
)
start "FamilyAlbum Backend" cmd /k python main.py
echo [OK] Backend started at http://localhost:8000

echo.
echo [4/4] Starting frontend...
cd ..\frontend
if not exist "node_modules" (
    echo First run - installing dependencies...
    npm install
)
start "FamilyAlbum Frontend" cmd /k npm run dev
echo [OK] Frontend started at http://localhost:3000

echo.
echo ========================================
echo   SUCCESS!
echo.
echo   Open browser: http://localhost:3000
echo.
echo   For public access, use tunnel tools:
echo   -花生壳: https://hsk.oray.com/
echo   - cpolar: https://www.cpolar.com/
echo   - ngrok: https://ngrok.com/
echo.
echo   Two windows will open - keep them running
echo ========================================
echo.
pause
