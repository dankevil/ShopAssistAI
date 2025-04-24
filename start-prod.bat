@echo off
echo ===================================
echo Starting ShopAssistAI Production Server
echo ===================================
echo.

echo Make sure PostgreSQL is running and your .env file is configured correctly
echo.
echo Starting production server...
call npm run windows:start
