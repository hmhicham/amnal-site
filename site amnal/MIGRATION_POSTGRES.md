# 🐘 Migration PostgreSQL - AMNAL IT System

## ✅ Fichiers Créés

### Backend (systeme-pannes-backend/)
1. **`database_schema_postgres.sql`** - Schéma PostgreSQL complet
2. **`server_postgres.js`** - Serveur Node.js avec PostgreSQL
3. **`.env.example`** - Configuration d'exemple
4. **`README_POSTGRES.md`** - Guide d'installation détaillé
5. **`package.json`** - Mis à jour avec `pg` au lieu de `mysql2`

## 🚀 Étapes Rapides

### 1. Installer PostgreSQL
```bash
# Windows (avec Chocolatey)
choco install postgresql

# Linux
sudo apt install postgresql postgresql-contrib
```

### 2. Créer la base de données
```bash
psql -U postgres
CREATE DATABASE systeme_pannes_it;
\c systeme_pannes_it
\i d:/site\ amnal/systeme-pannes-backend/database_schema_postgres.sql
```

### 3. Configurer l'application
```bash
cd "d:\site amnal\systeme-pannes-backend"

# Créer .env
copy .env.example .env

# Éditer .env avec vos informations PostgreSQL
notepad .env
```

### 4. Installer les dépendances
```bash
npm install
```

### 5. Activer le nouveau serveur
```bash
# Sauvegarder l'ancien
move server.js server_mysql.js.bak

# Utiliser PostgreSQL
move server_postgres.js server.js
```

### 6. Démarrer
```bash
npm run dev
```

## 📋 Configuration .env

```env
PORT=3000
JWT_SECRET=amnal_secret_2025

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE
DB_NAME=systeme_pannes_it
```

## 🔑 Comptes Test

- **Admin**: admin@amnal.dz / admin123
- **Technicien**: technicien@amnal.dz / admin123

## ✨ Avantages PostgreSQL

✅ **Performance** - Meilleur pour les requêtes complexes  
✅ **Fiabilité** - ACID complet, transactions robustes  
✅ **Fonctionnalités** - JSON, Full-text search, GIS  
✅ **Open Source** - Gratuit, communauté active  
✅ **Scalabilité** - Excellent pour grandes bases  
✅ **Standards** - SQL conforme aux standards  

## 📊 Changements Principaux

| Aspect | MySQL | PostgreSQL |
|--------|-------|------------|
| Driver | `mysql2` | `pg` |
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` |
| Paramètres | `?` | `$1, $2` |
| Résultats | `result.insertId` | `result.rows[0].id` |
| Tableaux | `result[0]` | `result.rows` |
| ENUM | Inline | `CREATE TYPE` |

## 🎯 Prochaines Étapes

1. ✅ Installer PostgreSQL
2. ✅ Créer la base de données
3. ✅ Configurer .env
4. ✅ Installer dépendances
5. ✅ Remplacer server.js
6. ✅ Tester l'API
7. ✅ Connecter le frontend

## 📞 Support

Pour plus de détails, consultez `README_POSTGRES.md` dans le dossier backend.

---

**Créé pour AMNAL Enterprise IT Solutions** 🏢
