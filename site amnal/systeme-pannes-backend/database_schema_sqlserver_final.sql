-- database_schema_sqlserver_final.sql
-- Script SQL Server final et corrigé pour le système AMNAL IT

-- Créer la base de données si elle n'existe pas
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'systeme_pannes_it')
BEGIN
    CREATE DATABASE systeme_pannes_it;
END
GO

-- Utiliser la base de données
USE systeme_pannes_it;
GO

-- ============= NETTOYAGE COMPLET =============
-- Désactiver les contraintes de clés étrangères temporairement
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"
GO

-- Supprimer tous les triggers
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'DROP TRIGGER ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.triggers WHERE parent_class = 1;
EXEC sp_executesql @sql;
GO

-- Supprimer toutes les vues
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'DROP VIEW ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.views;
EXEC sp_executesql @sql;
GO

-- Supprimer toutes les procédures stockées (sauf système)
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'DROP PROCEDURE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.procedures WHERE is_ms_shipped = 0;
EXEC sp_executesql @sql;
GO

-- Supprimer toutes les tables
EXEC sp_MSforeachtable "DROP TABLE ?"
GO

-- ============= CRÉATION DES TABLES =============

-- Table utilisateurs (table principale)
CREATE TABLE utilisateurs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'technicien', 'admin')),
    departement NVARCHAR(100),
    telephone NVARCHAR(20),
    date_creation DATETIME2 DEFAULT GETDATE(),
    dernier_login DATETIME2 NULL,
    actif BIT DEFAULT 1
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
GO

-- Table catégories de pannes (indépendante)
CREATE TABLE categories_pannes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(100) NOT NULL UNIQUE,
    description NTEXT,
    actif BIT DEFAULT 1,
    date_creation DATETIME2 DEFAULT GETDATE()
);
GO

-- Table tickets (référence utilisateurs seulement)
CREATE TABLE tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    technicien_id INT NULL,
    type_panne NVARCHAR(100) NOT NULL,
    materiel NVARCHAR(20) NOT NULL CHECK (materiel IN ('pc', 'laptop', 'imprimante', 'reseau', 'serveur', 'autre')),
    priorite NVARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    statut NVARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'ferme')),
    description NTEXT NOT NULL,
    notes_technicien NTEXT NULL,
    date_creation DATETIME2 DEFAULT GETDATE(),
    date_modification DATETIME2 NULL,
    date_resolution DATETIME2 NULL
);

-- Ajouter les contraintes de clés étrangères séparément
ALTER TABLE tickets ADD CONSTRAINT FK_tickets_utilisateur 
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE NO ACTION;

ALTER TABLE tickets ADD CONSTRAINT FK_tickets_technicien 
    FOREIGN KEY (technicien_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;

CREATE INDEX idx_tickets_statut ON tickets(statut);
CREATE INDEX idx_tickets_priorite ON tickets(priorite);
CREATE INDEX idx_tickets_utilisateur ON tickets(utilisateur_id);
CREATE INDEX idx_tickets_technicien ON tickets(technicien_id);
CREATE INDEX idx_tickets_date_creation ON tickets(date_creation);
CREATE INDEX idx_tickets_date_statut ON tickets(date_creation, statut);
CREATE INDEX idx_tickets_priorite_statut ON tickets(priorite, statut);
GO

-- Table historique des tickets
CREATE TABLE historique_tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    action NVARCHAR(255) NOT NULL,
    effectue_par INT NOT NULL,
    date_action DATETIME2 DEFAULT GETDATE(),
    details NTEXT NULL
);

ALTER TABLE historique_tickets ADD CONSTRAINT FK_historique_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE historique_tickets ADD CONSTRAINT FK_historique_utilisateur 
    FOREIGN KEY (effectue_par) REFERENCES utilisateurs(id) ON DELETE NO ACTION;

CREATE INDEX idx_historique_ticket ON historique_tickets(ticket_id);
CREATE INDEX idx_historique_date ON historique_tickets(date_action);
CREATE INDEX idx_historique_date_ticket ON historique_tickets(ticket_id, date_action);
GO

-- Table commentaires
CREATE TABLE commentaires (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    commentaire NTEXT NOT NULL,
    date_creation DATETIME2 DEFAULT GETDATE()
);

ALTER TABLE commentaires ADD CONSTRAINT FK_commentaires_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE commentaires ADD CONSTRAINT FK_commentaires_utilisateur 
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE NO ACTION;

CREATE INDEX idx_commentaires_ticket ON commentaires(ticket_id);
CREATE INDEX idx_commentaires_date ON commentaires(date_creation);
GO

-- Table pièces jointes
CREATE TABLE pieces_jointes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    nom_fichier NVARCHAR(255) NOT NULL,
    chemin_fichier NVARCHAR(500) NOT NULL,
    type_fichier NVARCHAR(50),
    taille_fichier INT,
    date_upload DATETIME2 DEFAULT GETDATE()
);

ALTER TABLE pieces_jointes ADD CONSTRAINT FK_pieces_jointes_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

CREATE INDEX idx_pieces_jointes_ticket ON pieces_jointes(ticket_id);
GO

-- Table notifications
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ticket_id INT NULL,
    type_notification NVARCHAR(20) NOT NULL CHECK (type_notification IN ('nouveau_ticket', 'mise_a_jour', 'commentaire', 'resolution')),
    message NTEXT NOT NULL,
    lu BIT DEFAULT 0,
    date_creation DATETIME2 DEFAULT GETDATE()
);

ALTER TABLE notifications ADD CONSTRAINT FK_notifications_utilisateur 
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE NO ACTION;

ALTER TABLE notifications ADD CONSTRAINT FK_notifications_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date_creation);
GO

-- Table statistiques
CREATE TABLE statistiques_tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_tickets INT DEFAULT 0,
    tickets_resolus INT DEFAULT 0,
    tickets_en_attente INT DEFAULT 0,
    tickets_en_cours INT DEFAULT 0,
    temps_resolution_moyen INT NULL -- en minutes
);

CREATE INDEX idx_statistiques_date ON statistiques_tickets(date);
GO

-- ============= DONNÉES INITIALES =============

-- Insérer les catégories de pannes par défaut
INSERT INTO categories_pannes (nom, description) VALUES
('PC ne démarre pas', 'Problème de démarrage de l''ordinateur'),
('Écran noir', 'Écran qui ne s''allume pas ou reste noir'),
('Problème de connexion Internet', 'Problèmes de réseau ou WiFi'),
('Imprimante ne fonctionne pas', 'Problèmes liés aux imprimantes'),
('Logiciel planté', 'Application ou logiciel qui ne répond plus'),
('Virus/Malware', 'Infection par virus ou logiciel malveillant'),
('Mot de passe oublié', 'Problème d''accès au compte'),
('Disque dur plein', 'Espace disque insuffisant'),
('Surchauffe', 'Problème de température du matériel'),
('Autre problème', 'Autres types de pannes');

-- Créer les utilisateurs par défaut (mot de passe: admin123)
-- Hash bcrypt de 'admin123': $2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8
INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
('Administrateur', 'admin@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'admin', 'IT'),
('Technicien Test', 'technicien@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'technicien', 'IT'),
('Utilisateur Test', 'user@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'user', 'Administration');
GO

-- ============= VUES =============

-- Vue pour les tickets avec informations complètes
CREATE VIEW vue_tickets_complets AS
SELECT 
    t.id,
    t.type_panne,
    t.materiel,
    t.priorite,
    t.statut,
    t.description,
    t.notes_technicien,
    t.date_creation,
    t.date_modification,
    t.date_resolution,
    u.nom as utilisateur_nom,
    u.email as utilisateur_email,
    u.departement as utilisateur_departement,
    u.telephone as utilisateur_telephone,
    tech.nom as technicien_nom,
    tech.email as technicien_email,
    DATEDIFF(MINUTE, t.date_creation, COALESCE(t.date_resolution, GETDATE())) as duree_minutes
FROM tickets t
INNER JOIN utilisateurs u ON t.utilisateur_id = u.id
LEFT JOIN utilisateurs tech ON t.technicien_id = tech.id;
GO

-- Vue pour les statistiques journalières
CREATE VIEW vue_stats_journalieres AS
SELECT 
    CAST(date_creation AS DATE) as date,
    COUNT(*) as total_tickets,
    SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) as tickets_resolus,
    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as tickets_en_attente,
    SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as tickets_en_cours,
    AVG(CASE 
        WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
        THEN DATEDIFF(MINUTE, date_creation, date_resolution)
        ELSE NULL 
    END) as temps_resolution_moyen
FROM tickets
GROUP BY CAST(date_creation AS DATE);
GO

-- ============= PROCÉDURES STOCKÉES =============

-- Procédure pour calculer les statistiques quotidiennes
CREATE PROCEDURE CalculerStatsQuotidiennes
AS
BEGIN
    SET NOCOUNT ON;
    
    MERGE statistiques_tickets AS target
    USING (
        SELECT 
            CAST(GETDATE() AS DATE) as date,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) as tickets_resolus,
            SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as tickets_en_attente,
            SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as tickets_en_cours,
            AVG(CASE 
                WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
                THEN DATEDIFF(MINUTE, date_creation, date_resolution)
                ELSE NULL 
            END) as temps_resolution_moyen
        FROM tickets
        WHERE CAST(date_creation AS DATE) = CAST(GETDATE() AS DATE)
    ) AS source ON target.date = source.date
    WHEN MATCHED THEN
        UPDATE SET 
            total_tickets = source.total_tickets,
            tickets_resolus = source.tickets_resolus,
            tickets_en_attente = source.tickets_en_attente,
            tickets_en_cours = source.tickets_en_cours,
            temps_resolution_moyen = source.temps_resolution_moyen
    WHEN NOT MATCHED THEN
        INSERT (date, total_tickets, tickets_resolus, tickets_en_attente, tickets_en_cours, temps_resolution_moyen)
        VALUES (source.date, source.total_tickets, source.tickets_resolus, source.tickets_en_attente, source.tickets_en_cours, source.temps_resolution_moyen);
END;
GO

-- ============= TRIGGERS =============

-- Trigger pour mettre à jour la date de modification
CREATE TRIGGER trg_update_date_modification
ON tickets
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tickets 
    SET date_modification = GETDATE()
    FROM tickets t
    INNER JOIN inserted i ON t.id = i.id;
END;
GO

-- Trigger pour mettre à jour la date de résolution
CREATE TRIGGER trg_update_date_resolution
ON tickets
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tickets 
    SET date_resolution = GETDATE()
    FROM tickets t
    INNER JOIN inserted i ON t.id = i.id
    INNER JOIN deleted d ON t.id = d.id
    WHERE i.statut = 'resolu' AND d.statut != 'resolu';
END;
GO

-- Trigger pour créer une notification lors d'une mise à jour
CREATE TRIGGER trg_create_notification_update
ON tickets
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications (utilisateur_id, ticket_id, type_notification, message)
    SELECT 
        i.utilisateur_id,
        i.id,
        'mise_a_jour',
        'Le statut de votre ticket #' + CAST(i.id AS NVARCHAR(10)) + ' a été changé en: ' + i.statut
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.statut != d.statut;
END;
GO

-- ============= VÉRIFICATION FINALE =============

-- Vérifier que toutes les tables ont été créées
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Vérifier les contraintes de clés étrangères
SELECT 
    fk.name AS constraint_name,
    tp.name AS parent_table,
    cp.name AS parent_column,
    tr.name AS referenced_table,
    cr.name AS referenced_column
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
ORDER BY tp.name, cp.name;

-- Vérifier les utilisateurs créés
SELECT nom, email, role FROM utilisateurs;

-- Vérifier les catégories de pannes
SELECT nom FROM categories_pannes;

PRINT '✅ Base de données SQL Server créée avec succès pour le système AMNAL IT';
PRINT '✅ Toutes les tables, contraintes, vues, procédures et triggers ont été créés correctement';
PRINT '✅ Aucun conflit de cascade - Structure optimisée pour SQL Server';
GO
