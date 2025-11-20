@echo off
echo ========================================
echo   AMNAL IT System - Backend Production
echo ========================================
echo.

echo Demarrage du backend avec PM2...
pm2 start server.js --name "amnal-backend"
pm2 save

echo.
echo Backend demarre avec succes!
echo.
echo Pour voir les logs: pm2 logs amnal-backend
echo Pour arreter: pm2 stop amnal-backend
echo Pour redemarrer: pm2 restart amnal-backend
echo.
pause
