@echo off
echo ========================================
echo 🚀 Déploiement AMNAL IT sur 129.168.0.2
echo ========================================

REM Configuration
set SERVER_IP=129.168.0.2
set SERVER_USER=administrator
set DEPLOY_PATH=/opt/amnal-it

echo.
echo 📦 Étape 1: Préparation des fichiers...

REM Créer le dossier de déploiement temporaire
if exist "deploy-temp" rmdir /s /q "deploy-temp"
mkdir deploy-temp

REM Copier les fichiers backend
echo Copie du backend...
xcopy "systeme-pannes-backend" "deploy-temp\systeme-pannes-backend" /E /I /H /Y
copy ".env.production" "deploy-temp\systeme-pannes-backend\.env"

REM Builder le frontend avec la bonne URL API
echo.
echo 🎨 Étape 2: Build du frontend...
cd frontend

REM Sauvegarder l'App.jsx original
copy "src\App.jsx" "src\App.jsx.backup"

REM Mettre à jour l'URL API pour le serveur
powershell -Command "(Get-Content 'src\App.jsx') -replace 'http://localhost:3000/api', 'http://%SERVER_IP%:3000/api' | Set-Content 'src\App.jsx'"

REM Builder l'application
call npm install
call npm run build

REM Restaurer l'App.jsx original
copy "src\App.jsx.backup" "src\App.jsx"
del "src\App.jsx.backup"

REM Copier le build
xcopy "dist" "..\deploy-temp\frontend\dist" /E /I /H /Y
xcopy "package.json" "..\deploy-temp\frontend\" /Y

cd ..

echo.
echo 📋 Étape 3: Création des scripts de déploiement...

REM Créer le script de déploiement pour le serveur
echo #!/bin/bash > deploy-temp\deploy-server.sh
echo echo "🚀 Installation AMNAL IT sur le serveur..." >> deploy-temp\deploy-server.sh
echo. >> deploy-temp\deploy-server.sh
echo # Créer les dossiers >> deploy-temp\deploy-server.sh
echo sudo mkdir -p %DEPLOY_PATH% >> deploy-temp\deploy-server.sh
echo sudo chown $USER:%DEPLOY_PATH% >> deploy-temp\deploy-server.sh
echo. >> deploy-temp\deploy-server.sh
echo # Backend >> deploy-temp\deploy-server.sh
echo echo "📦 Installation du backend..." >> deploy-temp\deploy-server.sh
echo cd %DEPLOY_PATH%/systeme-pannes-backend >> deploy-temp\deploy-server.sh
echo npm install --production >> deploy-temp\deploy-server.sh
echo. >> deploy-temp\deploy-server.sh
echo # Configuration SQL Server >> deploy-temp\deploy-server.sh
echo echo "🗄️ Configuration de la base de données SQL Server..." >> deploy-temp\deploy-server.sh
echo sqlcmd -S %SERVER_IP% -U amnal_user -P VotreMotDePasseSecurise123! -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'systeme_pannes_it') CREATE DATABASE systeme_pannes_it;" >> deploy-temp\deploy-server.sh
echo sqlcmd -S %SERVER_IP% -U amnal_user -P VotreMotDePasseSecurise123! -d systeme_pannes_it -i database_schema_sqlserver.sql >> deploy-temp\deploy-server.sh
echo node create-users.js >> deploy-temp\deploy-server.sh
echo. >> deploy-temp\deploy-server.sh
echo # PM2 >> deploy-temp\deploy-server.sh
echo echo "🚀 Démarrage avec PM2..." >> deploy-temp\deploy-server.sh
echo pm2 stop amnal-backend ^|^| true >> deploy-temp\deploy-server.sh
echo pm2 start server.js --name "amnal-backend" >> deploy-temp\deploy-server.sh
echo pm2 save >> deploy-temp\deploy-server.sh
echo. >> deploy-temp\deploy-server.sh
echo echo "✅ Déploiement terminé!" >> deploy-temp\deploy-server.sh
echo echo "🌐 Application accessible sur: http://%SERVER_IP%" >> deploy-temp\deploy-server.sh

REM Créer le fichier de configuration Nginx
echo server { > deploy-temp\nginx-amnal.conf
echo     listen 80; >> deploy-temp\nginx-amnal.conf
echo     server_name %SERVER_IP%; >> deploy-temp\nginx-amnal.conf
echo. >> deploy-temp\nginx-amnal.conf
echo     # Frontend React >> deploy-temp\nginx-amnal.conf
echo     location / { >> deploy-temp\nginx-amnal.conf
echo         root %DEPLOY_PATH%/frontend/dist; >> deploy-temp\nginx-amnal.conf
echo         try_files $uri $uri/ /index.html; >> deploy-temp\nginx-amnal.conf
echo     } >> deploy-temp\nginx-amnal.conf
echo. >> deploy-temp\nginx-amnal.conf
echo     # API Backend >> deploy-temp\nginx-amnal.conf
echo     location /api { >> deploy-temp\nginx-amnal.conf
echo         proxy_pass http://localhost:3000; >> deploy-temp\nginx-amnal.conf
echo         proxy_http_version 1.1; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header Upgrade $http_upgrade; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header Connection 'upgrade'; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header Host $host; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header X-Real-IP $remote_addr; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; >> deploy-temp\nginx-amnal.conf
echo         proxy_set_header X-Forwarded-Proto $scheme; >> deploy-temp\nginx-amnal.conf
echo     } >> deploy-temp\nginx-amnal.conf
echo } >> deploy-temp\nginx-amnal.conf

echo.
echo ========================================
echo ✅ Préparation terminée!
echo ========================================
echo.
echo 📁 Fichiers prêts dans le dossier: deploy-temp\
echo.
echo 🚀 Prochaines étapes:
echo 1. Copiez le dossier 'deploy-temp' sur votre serveur %SERVER_IP%
echo 2. Connectez-vous au serveur via SSH
echo 3. Exécutez: chmod +x deploy-server.sh ^&^& ./deploy-server.sh
echo 4. Configurez Nginx avec le fichier nginx-amnal.conf
echo.
echo 🌐 Votre application sera accessible sur: http://%SERVER_IP%
echo.
pause
