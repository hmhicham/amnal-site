# 🚀 Guide Rapide de Déploiement - AMNAL IT System

## Pour Déployer sur Windows Server en 5 Étapes

### ✅ Étape 1: Préparer le Package (sur votre PC)

Double-cliquez sur: `deploy-to-server.bat`

Cela va créer un dossier `deployment-package\` avec tout ce qu'il faut.

---

### ✅ Étape 2: Copier sur le Serveur

Copiez le dossier `deployment-package\` vers le serveur Windows:

```
C:\inetpub\amnal-it\
```

---

### ✅ Étape 3: Installer les Prérequis sur le Serveur

**A. Installer Node.js:**
- Télécharger: https://nodejs.org/ (version LTS)
- Installer avec les options par défaut

**B. Installer PostgreSQL:**
- Télécharger: https://www.postgresql.org/download/windows/
- Installer et noter le mot de passe postgres

**C. Installer PM2:**
```powershell
npm install -g pm2
npm install -g pm2-windows-service
pm2-service-install
```

---

### ✅ Étape 4: Configurer la Base de Données

**A. Créer la base de données:**

Ouvrir **SQL Shell (psql)** et exécuter:
```sql
CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';
\q
```

**B. Importer le schéma:**
```powershell
cd C:\inetpub\amnal-it\backend
psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql
```

**C. Créer les utilisateurs:**
```powershell
node create-users.js
```

---

### ✅ Étape 5: Démarrer l'Application

**A. Configurer le Backend:**

1. Copier `.env.example` vers `.env`
2. Éditer `.env` avec vos valeurs (mot de passe PostgreSQL, etc.)

**B. Installer et démarrer:**
```powershell
cd C:\inetpub\amnal-it\backend
npm install --production
pm2 start server.js --name amnal-backend
pm2 save
```

**C. Configurer IIS pour le Frontend:**

1. Ouvrir **IIS Manager**
2. Clic droit sur **Sites** → **Add Website**
   - Name: `AMNAL-IT`
   - Physical path: `C:\inetpub\amnal-it\frontend\dist`
   - Port: `80`
3. Installer **URL Rewrite Module** si pas déjà fait
4. Le fichier `web.config` est déjà dans `dist\`

---

## 🎯 Accéder à l'Application

**Frontend:** `http://IP-DU-SERVEUR` ou `http://localhost`

**Backend API:** `http://IP-DU-SERVEUR:3000/api`

**Comptes par défaut:**
- Admin: `admin@amnal.dz` / `admin123`
- User: `user@amnal.dz` / `admin123`

---

## 🔧 Commandes Utiles

### Voir les logs du backend:
```powershell
pm2 logs amnal-backend
```

### Redémarrer le backend:
```powershell
pm2 restart amnal-backend
```

### Arrêter le backend:
```powershell
pm2 stop amnal-backend
```

### Vérifier le statut:
```powershell
pm2 status
```

---

## ⚠️ Important: Configuration Production

**Avant de mettre en production, changez:**

1. **JWT_SECRET** dans `.env` (utilisez une clé longue et aléatoire)
2. **DB_PASSWORD** avec votre vrai mot de passe PostgreSQL
3. **L'URL du backend** dans le frontend (si différent de localhost)

---

## 🆘 Problèmes Courants

### Le backend ne démarre pas:
```powershell
cd C:\inetpub\amnal-it\backend
node server.js
# Regarder l'erreur affichée
```

### Le frontend affiche une page blanche:
- Ouvrir F12 dans le navigateur
- Vérifier la console pour les erreurs
- Vérifier que l'URL du backend est correcte

### Erreur de connexion PostgreSQL:
```powershell
# Vérifier que PostgreSQL fonctionne
Get-Service postgresql-x64-18

# Tester la connexion
cd C:\inetpub\amnal-it\backend
node test-connection.js
```

---

## 📞 Support

Pour plus de détails, consultez: `DEPLOYMENT_GUIDE.md`

---

**✅ C'est tout! Votre système AMNAL IT est maintenant en production!** 🎉
