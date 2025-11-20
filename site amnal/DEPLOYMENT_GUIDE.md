# 🚀 Guide de Déploiement - Système AMNAL IT

## Prérequis sur le Serveur Windows

1. **Node.js v18+** - https://nodejs.org/
2. **PostgreSQL 18** - https://www.postgresql.org/download/windows/
3. **PM2** (pour gérer les processus) - `npm install -g pm2`
4. **PM2 Windows Service** - `npm install -g pm2-windows-service`

---

## 📦 Étape 1: Copier les Fichiers

Copiez ces dossiers sur le serveur (par exemple: `C:\inetpub\amnal-it\`):
```
C:\inetpub\amnal-it\
├── frontend\
├── systeme-pannes-backend\
└── DEPLOYMENT_GUIDE.md
```

---

## 🗄️ Étape 2: Configurer PostgreSQL

### 2.1 Créer la base de données

Ouvrez **SQL Shell (psql)** ou **pgAdmin** et exécutez:

```sql
CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';
```

### 2.2 Importer le schéma

```powershell
cd C:\inetpub\amnal-it\systeme-pannes-backend
psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql
```

### 2.3 Créer les utilisateurs par défaut

```powershell
node create-users.js
```

---

## ⚙️ Étape 3: Configurer le Backend

### 3.1 Installer les dépendances

```powershell
cd C:\inetpub\amnal-it\systeme-pannes-backend
npm install --production
```

### 3.2 Configurer `.env`

Créez le fichier `.env` avec les bonnes valeurs:

```env
# Configuration du serveur
PORT=3000
JWT_SECRET=votre_secret_tres_securise_changez_moi_en_production

# Configuration PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
DB_NAME=systeme_pannes_it

# Configuration Email (optionnel)
SMTP_HOST=smtp.votreentreprise.dz
SMTP_PORT=587
EMAIL_USER=noreply@amnal.dz
EMAIL_PASS=votre_mot_de_passe_email
```

**⚠️ IMPORTANT:** Changez le `JWT_SECRET` en production!

---

## 🎨 Étape 4: Builder le Frontend

### 4.1 Installer les dépendances

```powershell
cd C:\inetpub\amnal-it\frontend
npm install
```

### 4.2 Configurer l'URL du backend

Éditez `frontend\src\App.jsx` ligne 7:

```javascript
// En développement:
const API_URL = 'http://localhost:3000/api';

// En production (remplacez par l'IP/domaine de votre serveur):
const API_URL = 'http://192.168.1.100:3000/api';
// OU
const API_URL = 'http://amnal-it.votredomaine.dz/api';
```

### 4.3 Builder l'application

```powershell
npm run build
```

Cela crée un dossier `dist\` avec les fichiers statiques.

---

## 🚀 Étape 5: Déployer avec PM2

### 5.1 Installer PM2 globalement

```powershell
npm install -g pm2
npm install -g pm2-windows-service
```

### 5.2 Configurer PM2 comme service Windows

```powershell
pm2-service-install
```

Répondez aux questions:
- PM2_HOME: `C:\ProgramData\pm2\home`
- PM2_SERVICE_SCRIPTS: (laissez vide)
- PM2_SERVICE_PM2_DIR: (laissez vide)

### 5.3 Démarrer le backend avec PM2

```powershell
cd C:\inetpub\amnal-it\systeme-pannes-backend
pm2 start server.js --name "amnal-backend"
pm2 save
```

### 5.4 Vérifier que ça fonctionne

```powershell
pm2 status
pm2 logs amnal-backend
```

---

## 🌐 Étape 6: Servir le Frontend

### Option A: Avec IIS (Recommandé pour Windows Server)

1. **Installer IIS** si pas déjà fait:
   - Ouvrir **Server Manager** → **Add Roles and Features**
   - Cocher **Web Server (IIS)**

2. **Configurer le site IIS**:
   - Ouvrir **IIS Manager**
   - Clic droit sur **Sites** → **Add Website**
   - **Site name**: `AMNAL-IT`
   - **Physical path**: `C:\inetpub\amnal-it\frontend\dist`
   - **Port**: `80` (ou `8080` si 80 est occupé)

3. **Configurer URL Rewrite** (pour React Router):
   - Installer **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
   - Créer `C:\inetpub\amnal-it\frontend\dist\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### Option B: Avec un serveur Node.js (serve)

```powershell
npm install -g serve
cd C:\inetpub\amnal-it\frontend
pm2 start "serve -s dist -l 80" --name "amnal-frontend"
pm2 save
```

---

## 🔒 Étape 7: Sécurité et Pare-feu

### 7.1 Ouvrir les ports nécessaires

Dans **Windows Firewall**:
- Port **80** (HTTP) - Frontend
- Port **3000** - Backend API
- Port **5432** - PostgreSQL (seulement localhost)

### 7.2 Configurer PostgreSQL pour n'accepter que localhost

Éditez `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`:

```
# Autoriser seulement localhost
host    all             all             127.0.0.1/32            scram-sha-256
```

Redémarrer PostgreSQL:
```powershell
Restart-Service postgresql-x64-18
```

---

## 📊 Étape 8: Vérification

### 8.1 Tester le backend

Ouvrir un navigateur: `http://localhost:3000/api/tickets`

Vous devriez voir: `{"error":"Token manquant"}`

### 8.2 Tester le frontend

Ouvrir: `http://localhost` ou `http://IP-DU-SERVEUR`

Vous devriez voir la page de login.

### 8.3 Tester la connexion complète

1. Login avec: `admin@amnal.dz` / `admin123`
2. Vérifier que les tickets s'affichent

---

## 🔄 Maintenance

### Redémarrer les services

```powershell
pm2 restart amnal-backend
pm2 logs amnal-backend
```

### Voir les logs

```powershell
pm2 logs
pm2 logs amnal-backend --lines 100
```

### Mettre à jour l'application

```powershell
# Backend
cd C:\inetpub\amnal-it\systeme-pannes-backend
pm2 stop amnal-backend
# Copier les nouveaux fichiers
npm install --production
pm2 start amnal-backend

# Frontend
cd C:\inetpub\amnal-it\frontend
# Copier les nouveaux fichiers
npm install
npm run build
# Copier dist\ vers IIS
```

---

## 🆘 Dépannage

### Le backend ne démarre pas

```powershell
cd C:\inetpub\amnal-it\systeme-pannes-backend
node server.js
# Regarder les erreurs
```

### PostgreSQL ne se connecte pas

```powershell
# Vérifier que PostgreSQL fonctionne
Get-Service postgresql-x64-18

# Tester la connexion
node test-connection.js
```

### Le frontend affiche une page blanche

- Vérifier la console du navigateur (F12)
- Vérifier que l'URL du backend est correcte dans `App.jsx`
- Vérifier que le backend est accessible

---

## 📞 Support

Pour toute question, vérifiez:
1. Les logs PM2: `pm2 logs`
2. Les logs PostgreSQL: `C:\Program Files\PostgreSQL\18\data\log\`
3. Les logs IIS: Event Viewer → Windows Logs → Application

---

## ✅ Checklist de Déploiement

- [ ] Node.js installé sur le serveur
- [ ] PostgreSQL installé et configuré
- [ ] Base de données créée et schéma importé
- [ ] Utilisateurs par défaut créés
- [ ] Backend `.env` configuré
- [ ] Frontend URL API mise à jour
- [ ] Frontend buildé (`npm run build`)
- [ ] PM2 installé et configuré comme service
- [ ] Backend démarré avec PM2
- [ ] IIS configuré avec URL Rewrite
- [ ] Pare-feu configuré
- [ ] Tests de connexion réussis
- [ ] JWT_SECRET changé en production

---

**🎉 Votre système AMNAL IT est maintenant en production!**
