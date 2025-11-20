# 🌐 Déploiement sur Serveur - AMNAL IT System

## 📋 Configuration Serveur: 129.168.0.2

### Prérequis sur le Serveur
- **OS**: Windows Server ou Linux
- **Node.js**: v18+
- **SQL Server**: 2019+ (déjà installé sur 129.168.0.2)
- **PM2**: Pour la gestion des processus
- **Nginx/IIS**: Pour servir le frontend

---

## 🗄️ Configuration Base de Données SQL Server

### Option 1: Base de données sur le même serveur (129.168.0.2)
```env
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=votre_mot_de_passe
DB_NAME=systeme_pannes_it
DB_TYPE=sqlserver
```

### Option 2: Base de données séparée
Si SQL Server est sur un serveur séparé:
```env
DB_HOST=129.168.0.2
DB_PORT=1433
DB_USER=amnal_user
DB_PASSWORD=mot_de_passe_securise
DB_NAME=systeme_pannes_it
DB_TYPE=sqlserver
```

---

## ⚙️ Configuration Backend (.env)

Créez le fichier `.env` sur le serveur:

```env
# Configuration du serveur
PORT=3000
NODE_ENV=production
JWT_SECRET=votre_secret_production_tres_securise_changez_moi

# Configuration SQL Server - SERVEUR 129.168.0.2
DB_HOST=129.168.0.2
DB_PORT=1433
DB_USER=amnal_user
DB_PASSWORD=votre_mot_de_passe_securise
DB_NAME=systeme_pannes_it
DB_TYPE=sqlserver

# Configuration Email
SMTP_HOST=smtp.amnal.dz
SMTP_PORT=587
EMAIL_USER=noreply@amnal.dz
EMAIL_PASS=votre_mot_de_passe_email

# Configuration CORS (pour permettre l'accès depuis le frontend)
CORS_ORIGIN=http://129.168.0.2,http://129.168.0.2:80,http://129.168.0.2:3000
```

---

## 🎨 Configuration Frontend

Mettez à jour `frontend/src/App.jsx`:

```javascript
// Configuration pour serveur de production
const API_URL = 'http://129.168.0.2:3000/api';

// OU si vous utilisez un nom de domaine:
// const API_URL = 'http://amnal-server.local:3000/api';
```

---

## 🚀 Scripts de Déploiement

### Script de déploiement automatique
```bash
#!/bin/bash
# deploy-to-production.sh

echo "🚀 Déploiement AMNAL IT sur serveur 129.168.0.2"

# 1. Copier les fichiers sur le serveur
echo "📦 Copie des fichiers..."
scp -r ./systeme-pannes-backend/ user@129.168.0.2:/opt/amnal-it/
scp -r ./frontend/ user@129.168.0.2:/opt/amnal-it/

# 2. Se connecter au serveur et installer
ssh user@129.168.0.2 << 'EOF'
cd /opt/amnal-it

# Backend
cd systeme-pannes-backend
npm install --production
node create-users.js

# Frontend
cd ../frontend
npm install
npm run build

# Démarrer avec PM2
pm2 stop amnal-backend || true
pm2 start server.js --name "amnal-backend" --cwd /opt/amnal-it/systeme-pannes-backend
pm2 save

echo "✅ Déploiement terminé!"
EOF
```

---

## 🔒 Sécurité et Réseau

### 1. Configuration Pare-feu
```bash
# Ouvrir les ports nécessaires
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # API Backend
sudo ufw allow 5432  # PostgreSQL (seulement si nécessaire)
```

### 2. Configuration PostgreSQL
```sql
-- Créer un utilisateur dédié
CREATE USER amnal_user WITH PASSWORD 'mot_de_passe_securise';
CREATE DATABASE systeme_pannes_it OWNER amnal_user;
GRANT ALL PRIVILEGES ON DATABASE systeme_pannes_it TO amnal_user;
```

### 3. Configuration pg_hba.conf
```
# Autoriser la connexion depuis l'application
host    systeme_pannes_it    amnal_user    127.0.0.1/32    scram-sha-256
host    systeme_pannes_it    amnal_user    129.168.0.0/24  scram-sha-256
```

---

## 🌐 Configuration Nginx (Recommandé)

```nginx
server {
    listen 80;
    server_name 129.168.0.2;

    # Frontend React
    location / {
        root /opt/amnal-it/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Monitoring et Logs

### PM2 Monitoring
```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs amnal-backend

# Monitoring en temps réel
pm2 monit
```

### Logs PostgreSQL
```bash
# Localisation des logs
tail -f /var/log/postgresql/postgresql-18-main.log
```

---

## 🔄 Maintenance

### Mise à jour de l'application
```bash
# Sur le serveur
cd /opt/amnal-it

# Backend
pm2 stop amnal-backend
cd systeme-pannes-backend
git pull  # ou copier les nouveaux fichiers
npm install --production
pm2 start amnal-backend

# Frontend
cd ../frontend
git pull  # ou copier les nouveaux fichiers
npm install
npm run build
```

### Sauvegarde Base de Données
```bash
# Sauvegarde quotidienne
pg_dump -h 129.168.0.2 -U amnal_user systeme_pannes_it > backup_$(date +%Y%m%d).sql
```

---

## ✅ Checklist de Déploiement

- [ ] Serveur 129.168.0.2 accessible via SSH
- [ ] PostgreSQL installé et configuré
- [ ] Node.js v18+ installé
- [ ] PM2 installé globalement
- [ ] Nginx/Apache configuré
- [ ] Base de données créée avec utilisateur dédié
- [ ] Fichier .env configuré avec les bonnes IP
- [ ] Frontend buildé avec la bonne URL API
- [ ] Pare-feu configuré
- [ ] Tests de connexion réussis
- [ ] Monitoring PM2 actif
- [ ] Sauvegarde automatique configurée

---

## 🆘 Dépannage

### Connexion Base de Données
```bash
# Tester la connexion depuis le serveur
psql -h 129.168.0.2 -U amnal_user -d systeme_pannes_it
```

### Vérifier les Services
```bash
# Backend
curl http://129.168.0.2:3000/api/tickets

# Frontend
curl http://129.168.0.2/
```

### Logs d'Erreur
```bash
# PM2
pm2 logs amnal-backend --err

# Nginx
tail -f /var/log/nginx/error.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-18-main.log
```

---

**🎉 Votre système AMNAL IT sera accessible sur: http://129.168.0.2**
