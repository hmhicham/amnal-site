# 🔒 Checklist Sécurité Réseau - Serveur 129.168.0.2

## 🌐 Configuration Réseau

### Adresse IP du Serveur: `129.168.0.2`

**⚠️ ATTENTION**: Cette adresse semble être une IP publique. Assurez-vous que c'est bien votre serveur!

---

## 🔥 Configuration Pare-feu

### Ports à Ouvrir
```bash
# Ports essentiels
sudo ufw allow 22/tcp    # SSH (administration)
sudo ufw allow 80/tcp    # HTTP (frontend web)
sudo ufw allow 443/tcp   # HTTPS (si SSL configuré)
sudo ufw allow 3000/tcp  # API Backend

# Port SQL Server (SEULEMENT si base externe)
sudo ufw allow from 129.168.0.0/24 to any port 1433
```

### Ports à FERMER/RESTREINDRE
```bash
# SQL Server - NE PAS exposer publiquement
sudo ufw deny 1433/tcp

# Autres services non nécessaires
sudo ufw deny 21/tcp     # FTP
sudo ufw deny 23/tcp     # Telnet
sudo ufw deny 3389/tcp   # RDP (sauf si nécessaire)
```

---

## 🗄️ Sécurité SQL Server

### 1. Configuration SQL Server Network
```sql
-- Limiter les connexions simultanées
EXEC sp_configure 'user connections', 50;
RECONFIGURE;

-- Désactiver les fonctionnalités dangereuses
EXEC sp_configure 'xp_cmdshell', 0;
RECONFIGURE;

-- Activer l'audit des connexions
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'AuditLevel', 
    REG_DWORD, 
    2;
```

### 2. Configuration Réseau SQL Server
```powershell
# Dans SQL Server Configuration Manager
# Protocoles réseau pour MSSQLSERVER → TCP/IP → Propriétés
# IPAll → Adresses IP spécifiques : 127.0.0.1, 129.168.0.2
# Port TCP : 1433
```

### 3. Utilisateur Dédié
```sql
-- Créer un login avec politique de mot de passe
CREATE LOGIN amnal_user WITH 
    PASSWORD = 'MotDePasseTresSecurise123!',
    CHECK_POLICY = ON,
    CHECK_EXPIRATION = ON;

-- Créer l'utilisateur dans la base
USE systeme_pannes_it;
CREATE USER amnal_user FOR LOGIN amnal_user;

-- Donner seulement les permissions nécessaires
ALTER ROLE db_datareader ADD MEMBER amnal_user;
ALTER ROLE db_datawriter ADD MEMBER amnal_user;
ALTER ROLE db_ddladmin ADD MEMBER amnal_user;
```

---

## 🔐 Sécurité Application

### 1. Variables d'Environnement Sécurisées
```env
# JWT Secret - Générer une clé forte
JWT_SECRET=$(openssl rand -base64 64)

# Mot de passe base de données fort
DB_PASSWORD=$(openssl rand -base64 32)
```

### 2. Configuration CORS Stricte
```javascript
// Dans server.js
const corsOptions = {
  origin: [
    'http://129.168.0.2',
    'http://129.168.0.2:80'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 3. Headers de Sécurité
```javascript
// Ajouter dans server.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

---

## 🌐 Configuration Nginx Sécurisée

```nginx
server {
    listen 80;
    server_name 129.168.0.2;
    
    # Sécurité headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Limiter la taille des uploads
    client_max_body_size 10M;
    
    # Cacher la version Nginx
    server_tokens off;

    # Frontend
    location / {
        root /opt/amnal-it/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API avec rate limiting
    location /api {
        # Rate limiting
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Bloquer l'accès aux fichiers sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|sql)$ {
        deny all;
    }
}

# Rate limiting zone
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
}
```

---

## 🔍 Monitoring et Logs

### 1. Logs à Surveiller
```bash
# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs Application
pm2 logs amnal-backend

# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-18-main.log

# Logs Système
tail -f /var/log/auth.log  # Tentatives de connexion SSH
```

### 2. Alertes Automatiques
```bash
# Script de monitoring (à exécuter via cron)
#!/bin/bash
# monitor-amnal.sh

# Vérifier si l'application fonctionne
if ! curl -f http://129.168.0.2:3000/api/tickets > /dev/null 2>&1; then
    echo "ALERTE: API Backend ne répond pas!" | mail -s "AMNAL IT - Problème API" admin@amnal.dz
fi

# Vérifier PostgreSQL
if ! pg_isready -h 129.168.0.2 -p 5432 > /dev/null 2>&1; then
    echo "ALERTE: PostgreSQL ne répond pas!" | mail -s "AMNAL IT - Problème DB" admin@amnal.dz
fi
```

---

## 🚨 Plan de Réponse aux Incidents

### En cas d'Intrusion Détectée
1. **Isoler le serveur**: `sudo ufw --force reset && sudo ufw deny incoming`
2. **Arrêter les services**: `pm2 stop all && sudo systemctl stop nginx`
3. **Analyser les logs**: Vérifier `/var/log/auth.log` et logs application
4. **Changer les mots de passe**: Base de données, JWT secret, utilisateurs
5. **Restaurer depuis sauvegarde** si nécessaire

### Contacts d'Urgence
- **Administrateur Système**: [Votre contact]
- **Responsable Sécurité**: [Votre contact]
- **Support Technique**: [Votre contact]

---

## ✅ Checklist de Sécurité

### Avant Déploiement
- [ ] Pare-feu configuré avec ports minimum
- [ ] PostgreSQL configuré pour connexions locales uniquement
- [ ] Utilisateur base de données dédié créé
- [ ] JWT_SECRET généré de manière sécurisée
- [ ] Mots de passe forts pour tous les comptes
- [ ] CORS configuré strictement
- [ ] Headers de sécurité ajoutés

### Après Déploiement
- [ ] Tests de pénétration basiques effectués
- [ ] Monitoring des logs activé
- [ ] Sauvegardes automatiques configurées
- [ ] Plan de réponse aux incidents documenté
- [ ] Contacts d'urgence définis
- [ ] Mise à jour système et sécurité planifiées

### Maintenance Régulière
- [ ] Mise à jour des dépendances Node.js
- [ ] Mise à jour PostgreSQL
- [ ] Mise à jour système d'exploitation
- [ ] Rotation des logs
- [ ] Test des sauvegardes
- [ ] Audit des accès utilisateurs

---

**⚠️ IMPORTANT**: Cette configuration assume que `129.168.0.2` est votre serveur privé. Si c'est une IP publique, renforcez encore plus la sécurité!
