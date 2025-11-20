// Configuration de l'application
// Modifiez cette valeur avant de déployer en production

const config = {
  // URL de l'API Backend
  // En développement: http://localhost:3000/api
  // En production: Remplacez par l'IP ou le domaine de votre serveur
  API_URL: import.meta.env.PROD 
    ? '/.netlify/functions/api'  // Use Netlify Functions as proxy
    : 'http://localhost:3000/api',
  
  // Nom de l'application
  APP_NAME: 'Système de Gestion IT - AMNAL',
  
  // Version
  VERSION: '1.0.0',
};

export default config;
