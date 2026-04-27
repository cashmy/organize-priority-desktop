@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-desktop-app.ps1" %*
set "exitCode=%ERRORLEVEL%"

if not "%exitCode%"=="0" (
  echo.
  echo Launch failed with exit code %exitCode%.
  pause
)

exit /b %exitCode%