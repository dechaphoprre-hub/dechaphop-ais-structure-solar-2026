@echo off
title Update Solar Portal Database
echo ----------------------------------------------------
echo  Updating Solar Structure Drawing Portal Database...
echo ----------------------------------------------------
echo.
python generate_data.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to update database! Please check if python is installed and openpyxl is installed.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Database updated successfully!
echo.
timeout /t 3
