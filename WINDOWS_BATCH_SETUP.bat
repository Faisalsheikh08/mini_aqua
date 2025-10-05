@echo off
echo =========================================
echo Question Bank App - Windows Setup Script
echo =========================================
echo.

echo [1/6] Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Make sure Node.js is installed and try again
    pause
    exit /b 1
)

echo.
echo [2/6] Starting PostgreSQL service...
net start postgresql-x64-15 2>nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Could not start PostgreSQL service automatically
    echo Please start it manually via Windows Services
)

echo.
echo [3/6] Creating database...
echo Please enter your PostgreSQL password when prompted:
psql -U postgres -c "CREATE DATABASE question_bank;"
psql -U postgres -c "CREATE USER question_user WITH PASSWORD 'password123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE question_bank TO question_user;"

echo.
echo [4/6] Creating environment configuration...
(
echo DATABASE_URL=postgresql://question_user:password123@localhost:5432/question_bank
echo NODE_ENV=development
echo PORT=5000
) > .env

echo.
echo [5/6] Setting up database schema...
call npm run db:push
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to set up database schema
    echo Please check your database connection and try again
    pause
    exit /b 1
)

echo.
echo [6/6] Setup complete!
echo.
echo =========================================
echo Your Question Bank Application is ready!
echo =========================================
echo.
echo To start the application:
echo   npm run dev
echo.
echo Then open: http://localhost:5000
echo.
echo Features available:
echo - Search 251,952+ multilingual questions
echo - Mathematical expression formatting
echo - Word document export
echo - Advanced filtering and bulk operations
echo.
pause

echo.
echo Would you like to start the application now? (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo Starting application...
    call npm run dev
) else (
    echo.
    echo To start later, run: npm run dev
    echo Then open: http://localhost:5000
)

pause