@echo off
echo ===================================
echo Starting ShopAssistAI Development Server
echo ===================================
echo.

echo Make sure PostgreSQL is running and your .env file is configured correctly
echo.
echo Starting development server...
call npm run windows:dev
