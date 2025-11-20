@echo off
echo ========================================
echo   AMNAL IT System - Frontend Build
echo ========================================
echo.

echo Installation des dependances...
call npm install

echo.
echo Construction du frontend pour production...
call npm run build

echo.
echo ========================================
echo   Build termine avec succes!
echo ========================================
echo.
echo Les fichiers sont dans le dossier: dist\
echo.
echo Prochaines etapes:
echo 1. Copier le dossier dist\ vers le serveur IIS
echo 2. Ou utiliser: serve -s dist -l 80
echo.
pause
