@echo off
title Dechaphop-AIS Structure Solar 2026 Portal Server
echo ----------------------------------------------------
echo  Starting Solar Structure Drawing Portal Server...
echo ----------------------------------------------------
echo.

:: Start browser pointing to localhost:8000
echo Opening http://localhost:8000 in your browser...
start http://localhost:8000

:: Start the python server
python server.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to start server! Please check if Python is installed.
    pause
)
