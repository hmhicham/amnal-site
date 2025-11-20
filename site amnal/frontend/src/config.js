// Configuration de l'application
// Modifiez cette valeur avant de déployer en production

const config = {
  // URL de l'API Backend
  // En développement: http://localhost:3000/api
  // En production: Remplacez par l'IP ou le domaine de votre serveur
  API_URL: import.meta.env.PROD 
    ? 'https://YOUR-RAILWAY-APP.railway.app/api'  // Replace with your Railway URL
    : 'http://localhost:3000/api',
  
  // Nom de l'application
  APP_NAME: 'Système de Gestion IT - AMNAL',
  
  // Version
  VERSION: '1.0.0',
};

export default config;
