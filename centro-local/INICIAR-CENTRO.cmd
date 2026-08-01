@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta disponible en esta terminal.
  echo Instale Node.js o abra una terminal donde funcione el comando node.
  pause
  exit /b 1
)

if not exist "node_modules\xlsx\package.json" (
  echo ERROR: Falta completar la instalacion inicial.
  echo Desde esta carpeta ejecute: npm install
  pause
  exit /b 1
)

echo Iniciando Centro local de Memo Geopolitico...
echo Para detenerlo, vuelva a esta ventana y pulse Ctrl+C.
node server.mjs --open

if errorlevel 1 (
  echo.
  echo El Centro se detuvo con un error. Copie el mensaje de esta ventana.
  pause
)
