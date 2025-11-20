# Migration vers PostgreSQL - Système de Gestion IT AMNAL

## 📋 Prérequis

- **PostgreSQL** 12 ou supérieur installé
- **Node.js** 16 ou supérieur
- **npm** ou **yarn**

## 🚀 Installation

### 1. Installer PostgreSQL

#### Windows:
```bash
# Télécharger depuis: https://www.postgresql.org/download/windows/
# Ou utiliser Chocolatey:
choco install postgresql

# Démarrer le service
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer la base de données
CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';

# Se connecter à la base
\c systeme_pannes_it

# Exécuter le script SQL
\i database_schema_postgres.sql

# Ou depuis le terminal:
psql -U postgres -d systeme_pannes_it -f database_schema_postgres.sql
```

### 3. Configurer l'application

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos informations
nano .env
```

Exemple de configuration `.env`:
```env
PORT=3000
JWT_SECRET=amnal_secret_key_2025

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=systeme_pannes_it

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=support@amnal.dz
EMAIL_PASS=votre_mot_de_passe_app
```

### 4. Installer les dépendances

```bash
cd systeme-pannes-backend
npm install
```

### 5. Remplacer server.js

```bash
# Sauvegarder l'ancien fichier
mv server.js server_mysql.js.bak

# Utiliser la version PostgreSQL
mv server_postgres.js server.js
```

### 6. Démarrer le serveur

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Vérification

Le serveur devrait afficher:
```
✅ Connecté à PostgreSQL
🚀 Serveur démarré sur le port 3000
📍 API disponible sur http://localhost:3000
🐘 Base de données: PostgreSQL
```

## 🔑 Comptes par défaut

Après l'exécution du script SQL, deux comptes sont créés:

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@amnal.dz | admin123 | admin |
| technicien@amnal.dz | admin123 | technicien |

⚠️ **Important**: Changez ces mots de passe en production!

## 🔧 Commandes PostgreSQL utiles

```bash
# Se connecter
psql -U postgres -d systeme_pannes_it

# Lister les tables
\dt

# Voir la structure d'une table
\d utilisateurs

# Voir les données
SELECT * FROM utilisateurs;

# Sauvegarder la base
pg_dump -U postgres systeme_pannes_it > backup.sql

# Restaurer la base
psql -U postgres systeme_pannes_it < backup.sql
```

## 📝 Différences MySQL → PostgreSQL

| Fonctionnalité | MySQL | PostgreSQL |
|----------------|-------|------------|
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` |
| Paramètres | `?` | `$1, $2, $3` |
| Résultats | `result.insertId` | `result.rows[0].id` |
| Concaténation | `CONCAT()` | `\|\|` ou `CONCAT()` |
| ENUM | `ENUM('a','b')` | `CREATE TYPE` |

## 🐛 Dépannage

### Erreur: "role does not exist"
```bash
# Créer l'utilisateur
createuser -U postgres -P votre_utilisateur
```

### Erreur: "database does not exist"
```bash
createdb -U postgres systeme_pannes_it
```

### Erreur de connexion
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Vérifier le fichier pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Ajouter: host all all 127.0.0.1/32 md5
```

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [Migration MySQL → PostgreSQL](https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL)

## ✅ Test de l'API

```bash
# Test de connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amnal.dz","password":"admin123"}'

# Créer un ticket (avec le token reçu)
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "typePanne":"PC ne démarre pas",
    "priorite":"haute",
    "description":"Mon PC ne s'\''allume plus",
    "materiel":"pc"
  }'
```

## 🎉 C'est prêt!

Votre système AMNAL fonctionne maintenant avec PostgreSQL!
