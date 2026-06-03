@echo off
title Deploy AIS Structure Solar 2026 to Netlify
echo ----------------------------------------------------
echo  Deploying Website to Netlify...
echo ----------------------------------------------------
echo.

:: Run netlify deploy to production
:: The first time, this will prompt you to link to your existing site.
:: Please choose "Link this directory to an existing site" and select "dechaphop-ais-structure-solar-2026".
call netlify deploy --dir=. --prod

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Deployment failed!
    echo Please make sure you have:
    echo 1. Installed netlify-cli (npm install -g netlify-cli)
    echo 2. Logged in to your Netlify account (netlify login)
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ----------------------------------------------------
echo  Deployment Completed Successfully!
echo ----------------------------------------------------
echo.
pause
