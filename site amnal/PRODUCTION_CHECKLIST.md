# ✅ Checklist de Mise en Production - AMNAL IT System

## 📋 Avant le Déploiement

### Sur Votre PC de Développement

- [ ] **Tester l'application complètement**
  - [ ] Login admin fonctionne
  - [ ] Login employé fonctionne
  - [ ] Création de tickets fonctionne
  - [ ] Mise à jour de statut fonctionne
  - [ ] Statistiques s'affichent correctement

- [ ] **Configurer l'URL du backend pour production**
  - [ ] Éditer `frontend/src/App.jsx` ligne 7
  - [ ] Remplacer `http://localhost:3000/api` par l'URL du serveur
  - [ ] Exemple: `http://192.168.1.100:3000/api`

- [ ] **Créer le package de déploiement**
  - [ ] Exécuter `deploy-to-server.bat`
  - [ ] Vérifier que le dossier `deployment-package` est créé
  - [ ] Copier sur clé USB ou réseau

---

## 🖥️ Sur le Serveur Windows

### Étape 1: Installation des Prérequis

- [ ] **Node.js installé**
  - [ ] Version 18 ou supérieure
  - [ ] Vérifier: `node --version`

- [ ] **PostgreSQL installé**
  - [ ] Version 18
  - [ ] Service démarré
  - [ ] Mot de passe postgres noté

- [ ] **PM2 installé globalement**
  - [ ] `npm install -g pm2`
  - [ ] `npm install -g pm2-windows-service`
  - [ ] `pm2-service-install` exécuté

- [ ] **IIS installé** (pour le frontend)
  - [ ] Web Server (IIS) activé
  - [ ] URL Rewrite Module installé

### Étape 2: Configuration de la Base de Données

- [ ] **Base de données créée**
  ```sql
  CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';
  ```

- [ ] **Schéma importé**
  ```powershell
  psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql
  ```

- [ ] **Utilisateurs créés**
  ```powershell
  node create-users.js
  ```

- [ ] **Connexion testée**
  ```powershell
  node test-connection.js
  ```

### Étape 3: Configuration du Backend

- [ ] **Fichiers copiés dans** `C:\inetpub\amnal-it\backend\`

- [ ] **Fichier .env créé et configuré**
  - [ ] `PORT=3000`
  - [ ] `JWT_SECRET` changé (clé longue et aléatoire)
  - [ ] `DB_HOST=localhost`
  - [ ] `DB_PORT=5432`
  - [ ] `DB_USER=postgres`
  - [ ] `DB_PASSWORD` (votre mot de passe)
  - [ ] `DB_NAME=systeme_pannes_it`
  - [ ] Configuration email (optionnel)

- [ ] **Dépendances installées**
  ```powershell
  npm install --production
  ```

- [ ] **Backend démarré avec PM2**
  ```powershell
  pm2 start server.js --name amnal-backend
  pm2 save
  ```

- [ ] **Backend fonctionne**
  - [ ] `pm2 status` montre "online"
  - [ ] `pm2 logs amnal-backend` pas d'erreurs
  - [ ] Test: `http://localhost:3000/api/tickets`

### Étape 4: Configuration du Frontend

- [ ] **Fichiers copiés dans** `C:\inetpub\amnal-it\frontend\dist\`

- [ ] **web.config copié** dans le dossier `dist\`

- [ ] **Site IIS créé**
  - [ ] Nom: AMNAL-IT
  - [ ] Physical path: `C:\inetpub\amnal-it\frontend\dist`
  - [ ] Port: 80 (ou autre)
  - [ ] Application Pool: DefaultAppPool

- [ ] **Site IIS démarré**

### Étape 5: Configuration Réseau et Sécurité

- [ ] **Pare-feu Windows configuré**
  - [ ] Port 80 (HTTP) ouvert
  - [ ] Port 3000 (Backend) ouvert
  - [ ] Port 5432 (PostgreSQL) fermé de l'extérieur

- [ ] **PostgreSQL sécurisé**
  - [ ] Accepte seulement localhost
  - [ ] `pg_hba.conf` configuré correctement

---

## 🧪 Tests de Validation

### Tests Fonctionnels

- [ ] **Frontend accessible**
  - [ ] Ouvrir `http://IP-DU-SERVEUR`
  - [ ] Page de login s'affiche correctement

- [ ] **Backend accessible**
  - [ ] Ouvrir `http://IP-DU-SERVEUR:3000/api/tickets`
  - [ ] Retourne une erreur JSON (normal sans token)

- [ ] **Login Admin**
  - [ ] Email: `admin@amnal.dz`
  - [ ] Password: `admin123`
  - [ ] Accès au panel admin

- [ ] **Login Employé**
  - [ ] Email: `user@amnal.dz`
  - [ ] Password: `admin123`
  - [ ] Accès au formulaire de création

- [ ] **Création de ticket**
  - [ ] Remplir le formulaire
  - [ ] Soumettre
  - [ ] Message de succès affiché

- [ ] **Gestion de ticket (Admin)**
  - [ ] Voir les tickets
  - [ ] Changer le statut
  - [ ] Ajouter une note

- [ ] **Statistiques**
  - [ ] Les compteurs s'affichent
  - [ ] Les nombres sont corrects

### Tests de Performance

- [ ] **Temps de chargement acceptable**
  - [ ] Page de login < 2 secondes
  - [ ] Liste des tickets < 3 secondes

- [ ] **Pas d'erreurs dans la console**
  - [ ] F12 → Console
  - [ ] Pas d'erreurs rouges

---

## 🔒 Sécurité Production

### Configuration Sécurisée

- [ ] **JWT_SECRET changé**
  - [ ] Clé longue (minimum 32 caractères)
  - [ ] Caractères aléatoires
  - [ ] Différent de l'exemple

- [ ] **Mots de passe par défaut changés**
  - [ ] Mot de passe admin changé
  - [ ] Mot de passe user changé
  - [ ] Mot de passe PostgreSQL fort

- [ ] **HTTPS configuré** (recommandé)
  - [ ] Certificat SSL installé
  - [ ] Redirection HTTP → HTTPS

- [ ] **Sauvegardes configurées**
  - [ ] Sauvegarde PostgreSQL quotidienne
  - [ ] Sauvegarde fichiers application

---

## 📊 Monitoring

### Logs à Surveiller

- [ ] **Logs Backend**
  ```powershell
  pm2 logs amnal-backend
  ```

- [ ] **Logs PostgreSQL**
  - [ ] `C:\Program Files\PostgreSQL\18\data\log\`

- [ ] **Logs IIS**
  - [ ] Event Viewer → Windows Logs → Application

### Commandes Utiles

```powershell
# Statut des services
pm2 status
Get-Service postgresql-x64-18

# Redémarrer backend
pm2 restart amnal-backend

# Voir les logs en temps réel
pm2 logs amnal-backend --lines 50

# Redémarrer PostgreSQL
Restart-Service postgresql-x64-18
```

---

## 📞 Contact et Support

### En cas de problème

1. **Vérifier les logs** (pm2 logs)
2. **Tester la connexion DB** (node test-connection.js)
3. **Consulter** DEPLOYMENT_GUIDE.md
4. **Redémarrer les services** si nécessaire

---

## ✅ Validation Finale

- [ ] **Application accessible depuis le réseau local**
- [ ] **Tous les utilisateurs peuvent se connecter**
- [ ] **Les tickets peuvent être créés et gérés**
- [ ] **Pas d'erreurs dans les logs**
- [ ] **Performance acceptable**
- [ ] **Sécurité configurée**
- [ ] **Sauvegardes en place**

---

## 🎉 Mise en Production Réussie!

Date de déploiement: _______________

Déployé par: _______________

Notes: _______________________________________________

____________________________________________________

____________________________________________________

---

**Système AMNAL IT - Version 1.0.0**
