@echo off
chcp 65001 >nul
title NegraLuna HomeStudio - Mapa Vivo
cd /d "%~dp0"
echo.
echo   NegraLuna HomeStudio - iniciando servidor local...
echo.
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 servir.py
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    python servir.py
  ) else (
    echo.
    echo   [!] No encontre Python en este PC.
    echo       Instalalo gratis desde https://www.python.org/downloads/
    echo       (marca la casilla "Add Python to PATH" al instalar)
    echo.
  )
)
pause
