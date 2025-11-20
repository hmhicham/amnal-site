# 🗄️ Configuration SQL Server pour AMNAL IT

## 📋 Prérequis SQL Server

### Installation SQL Server sur 129.168.0.2
- **SQL Server 2019** ou plus récent
- **SQL Server Management Studio (SSMS)**
- **SQL Server Authentication** activé
- **TCP/IP** activé pour les connexions réseau

---

## 🔧 Configuration SQL Server

### 1. Activer l'Authentification Mixte

Dans **SSMS**, connectez-vous au serveur et :

1. **Clic droit sur le serveur** → **Propriétés**
2. **Sécurité** → **Mode d'authentification du serveur**
3. Sélectionner : **Mode d'authentification SQL Server et Windows**
4. **Redémarrer le service SQL Server**

### 2. Activer TCP/IP

Dans **SQL Server Configuration Manager** :

1. **Protocoles réseau pour MSSQLSERVER**
2. **Clic droit sur TCP/IP** → **Activer**
3. **Propriétés TCP/IP** → **Adresses IP**
4. **IPAll** → **Port TCP : 1433**
5. **Redémarrer le service SQL Server**

### 3. Configurer le Pare-feu Windows

```powershell
# Ouvrir le port SQL Server
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow

# Ou via l'interface graphique :
# Pare-feu Windows → Règles de trafic entrant → Nouvelle règle → Port → TCP → 1433
```

---

## 👤 Création de l'Utilisateur de Base de Données

### Script SQL à exécuter dans SSMS :

```sql
-- 1. Créer la base de données
CREATE DATABASE systeme_pannes_it;
GO

-- 2. Créer un login SQL Server
CREATE LOGIN amnal_user WITH PASSWORD = 'VotreMotDePasseSecurise123!';
GO

-- 3. Utiliser la base de données
USE systeme_pannes_it;
GO

-- 4. Créer l'utilisateur dans la base
CREATE USER amnal_user FOR LOGIN amnal_user;
GO

-- 5. Donner les permissions nécessaires
ALTER ROLE db_owner ADD MEMBER amnal_user;
GO

-- 6. Vérifier la création
SELECT name FROM sys.database_principals WHERE type = 'S';
GO
```

---

## 🗃️ Création du Schéma de Base de Données

### Exécuter le script de création :

```sql
-- Dans SSMS, ouvrir et exécuter le fichier :
-- database_schema_sqlserver.sql
```

**OU** via ligne de commande :

```powershell
# Depuis le dossier systeme-pannes-backend
sqlcmd -S 129.168.0.2 -U amnal_user -P VotreMotDePasseSecurise123! -d systeme_pannes_it -i database_schema_sqlserver.sql
```

---

## 🔒 Configuration de Sécurité SQL Server

### 1. Paramètres de Sécurité Recommandés

```sql
-- Désactiver xp_cmdshell (sécurité)
EXEC sp_configure 'xp_cmdshell', 0;
RECONFIGURE;

-- Configurer les connexions maximales
EXEC sp_configure 'user connections', 50;
RECONFIGURE;

-- Activer l'audit des connexions échouées
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'AuditLevel', 
    REG_DWORD, 
    2;
```

### 2. Politique de Mot de Passe

```sql
-- Vérifier la politique de mot de passe
SELECT 
    name,
    is_policy_checked,
    is_expiration_checked
FROM sys.sql_logins 
WHERE name = 'amnal_user';

-- Modifier si nécessaire
ALTER LOGIN amnal_user WITH CHECK_POLICY = ON, CHECK_EXPIRATION = ON;
```

---

## 🌐 Configuration Réseau

### 1. Tester la Connexion depuis un Client

```powershell
# Test de connectivité réseau
Test-NetConnection -ComputerName 129.168.0.2 -Port 1433

# Test avec telnet
telnet 129.168.0.2 1433
```

### 2. Chaîne de Connexion pour l'Application

```javascript
// Configuration dans server.js
const config = {
    server: '129.168.0.2',
    port: 1433,
    database: 'systeme_pannes_it',
    user: 'amnal_user',
    password: 'VotreMotDePasseSecurise123!',
    options: {
        encrypt: true, // Pour Azure
        trustServerCertificate: true // Pour serveur local
    }
};
```

---

## 📊 Vérification de l'Installation

### 1. Test de Connexion SQL

```sql
-- Vérifier la version SQL Server
SELECT @@VERSION;

-- Vérifier les bases de données
SELECT name FROM sys.databases;

-- Vérifier les utilisateurs
USE systeme_pannes_it;
SELECT name, type_desc FROM sys.database_principals;

-- Tester les tables créées
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;
```

### 2. Test depuis Node.js

Créer un fichier `test-sqlserver-connection.js` :

```javascript
const sql = require('mssql');

const config = {
    server: '129.168.0.2',
    port: 1433,
    database: 'systeme_pannes_it',
    user: 'amnal_user',
    password: 'VotreMotDePasseSecurise123!',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        await sql.connect(config);
        console.log('✅ Connexion SQL Server réussie!');
        
        const result = await sql.query('SELECT COUNT(*) as count FROM utilisateurs');
        console.log('📊 Nombre d\'utilisateurs:', result.recordset[0].count);
        
        await sql.close();
    } catch (err) {
        console.error('❌ Erreur de connexion:', err);
    }
}

testConnection();
```

---

## 🔄 Maintenance SQL Server

### 1. Sauvegarde Automatique

```sql
-- Créer un plan de sauvegarde
BACKUP DATABASE systeme_pannes_it 
TO DISK = 'C:\Backups\systeme_pannes_it_backup.bak'
WITH FORMAT, INIT;

-- Script de sauvegarde quotidienne (à programmer)
BACKUP DATABASE systeme_pannes_it 
TO DISK = 'C:\Backups\systeme_pannes_it_' + 
    CONVERT(VARCHAR, GETDATE(), 112) + '.bak'
WITH FORMAT, INIT;
```

### 2. Monitoring des Performances

```sql
-- Vérifier l'utilisation de l'espace
SELECT 
    DB_NAME() AS DatabaseName,
    name AS LogicalName,
    physical_name AS PhysicalName,
    size * 8/1024 AS SizeMB,
    max_size * 8/1024 AS MaxSizeMB
FROM sys.database_files;

-- Vérifier les connexions actives
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    login_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1;
```

---

## 🆘 Dépannage SQL Server

### Problèmes Courants

#### 1. **Erreur : "Login failed for user"**
```sql
-- Vérifier que l'utilisateur existe
SELECT name FROM sys.sql_logins WHERE name = 'amnal_user';

-- Réinitialiser le mot de passe
ALTER LOGIN amnal_user WITH PASSWORD = 'NouveauMotDePasse123!';
```

#### 2. **Erreur : "Cannot connect to server"**
```powershell
# Vérifier que le service fonctionne
Get-Service -Name MSSQLSERVER

# Redémarrer le service si nécessaire
Restart-Service MSSQLSERVER
```

#### 3. **Erreur : "TCP Provider: No connection could be made"**
- Vérifier que TCP/IP est activé
- Vérifier le pare-feu Windows
- Vérifier que le port 1433 est ouvert

### Logs à Consulter

```powershell
# Logs SQL Server
Get-EventLog -LogName Application -Source "MSSQLSERVER" -Newest 10

# Ou dans SSMS : Management → SQL Server Logs
```

---

## ✅ Checklist SQL Server

### Configuration Initiale
- [ ] SQL Server installé et démarré
- [ ] Authentification mixte activée
- [ ] TCP/IP activé sur le port 1433
- [ ] Pare-feu configuré
- [ ] Base de données `systeme_pannes_it` créée
- [ ] Utilisateur `amnal_user` créé avec permissions
- [ ] Schéma de base importé
- [ ] Données initiales insérées

### Tests de Validation
- [ ] Connexion depuis SSMS réussie
- [ ] Connexion depuis Node.js réussie
- [ ] Tables créées correctement
- [ ] Utilisateurs par défaut présents
- [ ] Test de création/lecture de tickets

### Sécurité
- [ ] Mot de passe fort pour `amnal_user`
- [ ] Politique de mot de passe activée
- [ ] Audit des connexions configuré
- [ ] Sauvegarde automatique programmée

---

**🎉 Votre SQL Server est maintenant prêt pour l'application AMNAL IT !**
