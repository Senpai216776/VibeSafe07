@echo off
title VibeSafe GitHub Uploader
cd /d "%~dp0"
echo ======================================================
echo    VibeSafe - Automatic GitHub Uploader
echo ======================================================
echo.
node upload_to_github.js
echo.
pause
