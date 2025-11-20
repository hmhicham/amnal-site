@echo off
echo ========================================
echo   AMNAL IT System - Deployment Helper
echo ========================================
echo.
echo Ce script vous aide a preparer le deploiement
echo.
echo Etapes:
echo 1. Builder le frontend
echo 2. Preparer les fichiers pour le serveur
echo 3. Creer un package de deploiement
echo.
pause

echo.
echo [1/3] Construction du frontend...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [2/3] Creation du dossier de deploiement...
if exist "deployment-package" rmdir /s /q deployment-package
mkdir deployment-package
mkdir deployment-package\frontend
mkdir deployment-package\backend

echo.
echo [3/3] Copie des fichiers...

REM Copier le frontend build
xcopy /E /I /Y frontend\dist deployment-package\frontend\dist
copy frontend\package.json deployment-package\frontend\

REM Copier le backend
xcopy /E /I /Y systeme-pannes-backend deployment-package\backend
del deployment-package\backend\node_modules /s /q 2>nul
del deployment-package\backend\.env 2>nul

REM Copier les fichiers de configuration
copy DEPLOYMENT_GUIDE.md deployment-package\
copy systeme-pannes-backend\.env.example deployment-package\backend\.env.example
copy systeme-pannes-backend\start-production.bat deployment-package\backend\

echo.
echo ========================================
echo   Package de deploiement cree!
echo ========================================
echo.
echo Dossier: deployment-package\
echo.
echo Prochaines etapes:
echo 1. Copier le dossier 'deployment-package' vers le serveur
echo 2. Suivre les instructions dans DEPLOYMENT_GUIDE.md
echo.
echo Structure:
echo   deployment-package\
echo   ├── frontend\dist\     (fichiers statiques)
echo   ├── backend\           (code Node.js)
echo   └── DEPLOYMENT_GUIDE.md
echo.
pause
