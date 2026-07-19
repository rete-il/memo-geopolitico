@echo off
setlocal
cd /d "%~dp0"
node tools\responsive-preview\server.mjs --open
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo La vista responsive termino con error ^(codigo %EXIT_CODE%^).
)
endlocal & exit /b %EXIT_CODE%
