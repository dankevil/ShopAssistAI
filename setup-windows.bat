@echo off
echo ===================================
echo ShopAssistAI Windows Setup Script
echo ===================================
echo.

echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies!
    exit /b %ERRORLEVEL%
)
echo Dependencies installed successfully!
echo.

echo Checking for PostgreSQL database...
echo Please make sure PostgreSQL is running and you have created a database named 'shopassist'
echo.
echo Press any key to continue with database migrations...
pause > nul

echo Running database migrations...
call npm run db:migrate
if %ERRORLEVEL% neq 0 (
    echo Error running database migrations!
    echo Please check your DATABASE_URL in the .env file
    exit /b %ERRORLEVEL%
)
echo Database migrations completed successfully!
echo.

echo ===================================
echo Setup completed successfully!
echo.
echo To start the development server, run:
echo npm run windows:dev
echo.
echo To build for production, run:
echo npm run build
echo.
echo To start the production server, run:
echo npm run windows:start
echo ===================================
