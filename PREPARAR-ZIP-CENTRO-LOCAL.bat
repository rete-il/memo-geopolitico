@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

title Memo Geopolitico - Preparar ZIP del Centro local

rem Este archivo debe ejecutarse desde la raiz del proyecto.
set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo.
echo ============================================================
echo  Memo Geopolitico - captura tecnica para el Centro local
echo ============================================================
echo.

if not exist "%PROJECT_ROOT%\package.json" goto :invalid_root
if not exist "%PROJECT_ROOT%\centro-local\modules\observatorio\package.json" goto :invalid_root
if not exist "%PROJECT_ROOT%\tools\validate-public-data.mjs" goto :invalid_root

where powershell.exe >nul 2>&1
if errorlevel 1 goto :missing_powershell

for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"
if not defined STAMP set "STAMP=sin-fecha"

set "ZIP_FILE=%PROJECT_ROOT%\memo-geopolitico-centro-local-%STAMP%.zip"
set "STAGE=%TEMP%\memo-geopolitico-centro-local-%STAMP%-%RANDOM%"
set "STAGE_ROOT=%STAGE%\memo-geopolitico"
set "DIAG=%STAGE_ROOT%\_diagnostico-centro-local"

echo Proyecto:  %PROJECT_ROOT%
echo Destino:   %ZIP_FILE%
echo.
echo [1/4] Copiando la fuente local actual...

mkdir "%STAGE_ROOT%" >nul 2>&1

rem Se copia la fuente real y los datos de estado del Centro. Se omiten solamente
rem dependencias reinstalables, builds, caches, repositorio Git, secretos y salidas.
robocopy "%PROJECT_ROOT%" "%STAGE_ROOT%" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ ^
  /XD ".git" "node_modules" "dist" "dist-preview" ".astro" ".netlify" ".cache" ^
      "coverage" "__pycache__" ".pytest_cache" ".venv" "venv" ^
  /XF "*.zip" "*.log" "*.tmp" "Thumbs.db" ".DS_Store" ^
      ".env" ".env.*" ^
  /NFL /NDL /NJH /NJS /NP >nul

set "COPY_RC=!ERRORLEVEL!"
if !COPY_RC! GEQ 8 goto :copy_failed

echo [2/4] Registrando rama, estado local y diferencias...
mkdir "%DIAG%" >nul 2>&1

(
  echo Captura tecnica para revisar las correcciones del Centro local.
  echo.
  echo Origen: %PROJECT_ROOT%
  echo Generada: %DATE% %TIME%
  echo.
  echo La captura no ejecuta add, commit, push, merge, rebase ni reset.
  echo Los archivos de esta carpeta son solamente diagnosticos de lectura.
) > "%DIAG%\LEEME.txt"

git -C "%PROJECT_ROOT%" branch --show-current > "%DIAG%\git-branch-show-current.txt" 2>&1
git -C "%PROJECT_ROOT%" status -sb > "%DIAG%\git-status-sb.txt" 2>&1
git -C "%PROJECT_ROOT%" status --short > "%DIAG%\git-status-short.txt" 2>&1
git -C "%PROJECT_ROOT%" diff --stat > "%DIAG%\git-diff-stat.txt" 2>&1
git -C "%PROJECT_ROOT%" diff --name-status > "%DIAG%\git-diff-name-status.txt" 2>&1
git -C "%PROJECT_ROOT%" diff --cached --stat > "%DIAG%\git-diff-cached-stat.txt" 2>&1
git -C "%PROJECT_ROOT%" ls-files --others --exclude-standard > "%DIAG%\git-untracked.txt" 2>&1
git -C "%PROJECT_ROOT%" rev-parse HEAD > "%DIAG%\git-head.txt" 2>&1
git -C "%PROJECT_ROOT%" remote -v > "%DIAG%\git-remotes.txt" 2>&1
git -C "%PROJECT_ROOT%" diff --no-ext-diff > "%DIAG%\cambios-locales.patch" 2>&1

(
  where git 2>nul
  git --version 2>nul
  where node 2>nul
  node --version 2>nul
  where npm 2>nul
  call npm --version 2>nul
  powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString()" 2>nul
) > "%DIAG%\versiones-herramientas.txt"

echo [3/4] Generando manifiesto SHA-256...
set "MG_STAGE_ROOT=%STAGE_ROOT%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root=$env:MG_STAGE_ROOT; $manifest=Join-Path $root '_diagnostico-centro-local\MANIFIESTO-SHA256.txt'; Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.FullName -ne $manifest } | Sort-Object FullName | ForEach-Object { $relative=$_.FullName.Substring($root.Length+1); $hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash; '{0}  {1}' -f $hash,$relative } | Set-Content -LiteralPath $manifest -Encoding UTF8"
if errorlevel 1 goto :manifest_failed

echo [4/4] Comprimiendo el paquete...
set "MG_ZIP_FILE=%ZIP_FILE%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "Compress-Archive -LiteralPath $env:MG_STAGE_ROOT -DestinationPath $env:MG_ZIP_FILE -CompressionLevel Optimal -Force"
if errorlevel 1 goto :zip_failed

rmdir /S /Q "%STAGE%" >nul 2>&1

for %%I in ("%ZIP_FILE%") do set "ZIP_SIZE=%%~zI"
echo.
echo ============================================================
echo  ZIP creado correctamente
echo ============================================================
echo.
echo Archivo:
echo %ZIP_FILE%
echo.
echo Tamano: !ZIP_SIZE! bytes
echo.
echo Adjunta ese ZIP en el chat Desarrollador ^(New^).
echo No se modifico GitHub ni se ejecuto ninguna operacion Git de escritura.
echo.
pause
exit /b 0

:invalid_root
echo ERROR: este BAT no esta en la raiz correcta del proyecto.
echo.
echo Copialo dentro de la carpeta que contiene simultaneamente:
echo   package.json
echo   centro-local\modules\observatorio\package.json
echo   tools\validate-public-data.mjs
echo.
pause
exit /b 2

:missing_powershell
echo ERROR: PowerShell no esta disponible en este equipo.
echo.
pause
exit /b 3

:copy_failed
echo ERROR: Robocopy no pudo preparar la captura. Codigo: !COPY_RC!
goto :cleanup_error

:manifest_failed
echo ERROR: no se pudo generar el manifiesto SHA-256.
goto :cleanup_error

:zip_failed
echo ERROR: no se pudo crear el archivo ZIP.
goto :cleanup_error

:cleanup_error
if defined STAGE if exist "%STAGE%" rmdir /S /Q "%STAGE%" >nul 2>&1
echo No se realizo ninguna operacion Git de escritura.
echo.
pause
exit /b 4
