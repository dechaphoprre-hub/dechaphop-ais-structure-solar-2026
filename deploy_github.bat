@echo off
title Deploy to GitHub Pages
echo ----------------------------------------------------
echo  Deploying Website to GitHub Pages...
echo ----------------------------------------------------
echo.

:: Initialize git if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
)

:: Set local Git identity if not set to prevent "Author identity unknown" error
git config user.name >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Setting temporary Git identity...
    git config user.name "Dechaphop"
    git config user.email "dechaphop.rre@gmail.com"
)

:: Add all files
git add -A

:: Commit changes
git commit -m "Deploy Solar Portal v2.5 to GitHub Pages"

:: Set branch name to main
git branch -M main

:: Prompt for GitHub Username to link remote
echo.
set /p username="Enter your GitHub Username (NOT repository name): "

:: Check if remote already exists, if so, delete it first to avoid errors
git remote remove origin >nul 2>&1

:: Add the new remote origin
git remote add origin https://github.com/%username%/dechaphop-ais-structure-solar-2026.git

echo.
echo Pushing code to GitHub...
echo (If prompted, please log in or authorize GitHub in your browser)
echo.

git push -u origin main --force

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Push failed! Please check:
    echo 1. You created a repository named 'dechaphop-ais-structure-solar-2026' on GitHub.
    echo 2. Your username is spelled correctly.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ----------------------------------------------------
echo  Successfully pushed to GitHub!
echo ----------------------------------------------------
echo.
echo Next Steps:
echo 1. Go to your repository on GitHub.
echo 2. Click Settings -> Pages (on the left menu).
echo 3. Under "Build and deployment", select Branch: 'main' and click Save.
echo.
echo Your site will be live at: https://%username%.github.io/dechaphop-ais-structure-solar-2026/
echo.
pause
