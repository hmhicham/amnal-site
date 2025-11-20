-- database_schema_sqlserver.sql
-- Création de la base de données SQL Server pour le système de gestion des pannes IT

-- Créer la base de données (exécuter en tant qu'administrateur)
-- CREATE DATABASE systeme_pannes_it;
-- GO

-- Utiliser la base de données
USE systeme_pannes_it;
GO

-- ============= TABLE UTILISATEURS =============
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

-- ============= TABLE TICKETS =============
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
    date_resolution DATETIME2 NULL,
    
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (technicien_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX idx_tickets_statut ON tickets(statut);
CREATE INDEX idx_tickets_priorite ON tickets(priorite);
CREATE INDEX idx_tickets_utilisateur ON tickets(utilisateur_id);
CREATE INDEX idx_tickets_technicien ON tickets(technicien_id);
CREATE INDEX idx_tickets_date_creation ON tickets(date_creation);
CREATE INDEX idx_tickets_date_statut ON tickets(date_creation, statut);
CREATE INDEX idx_tickets_priorite_statut ON tickets(priorite, statut);

-- ============= TABLE HISTORIQUE DES TICKETS =============
CREATE TABLE historique_tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    action NVARCHAR(255) NOT NULL,
    effectue_par INT NOT NULL,
    date_action DATETIME2 DEFAULT GETDATE(),
    details NTEXT NULL,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (effectue_par) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE INDEX idx_historique_ticket ON historique_tickets(ticket_id);
CREATE INDEX idx_historique_date ON historique_tickets(date_action);
CREATE INDEX idx_historique_date_ticket ON historique_tickets(ticket_id, date_action);

-- ============= TABLE CATEGORIES DE PANNES =============
CREATE TABLE categories_pannes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(100) NOT NULL UNIQUE,
    description NTEXT,
    actif BIT DEFAULT 1,
    date_creation DATETIME2 DEFAULT GETDATE()
);

-- ============= TABLE COMMENTAIRES =============
CREATE TABLE commentaires (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    commentaire NTEXT NOT NULL,
    date_creation DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE INDEX idx_commentaires_ticket ON commentaires(ticket_id);
CREATE INDEX idx_commentaires_date ON commentaires(date_creation);

-- ============= TABLE PIECES JOINTES =============
CREATE TABLE pieces_jointes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    nom_fichier NVARCHAR(255) NOT NULL,
    chemin_fichier NVARCHAR(500) NOT NULL,
    type_fichier NVARCHAR(50),
    taille_fichier INT,
    date_upload DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX idx_pieces_jointes_ticket ON pieces_jointes(ticket_id);

-- ============= TABLE NOTIFICATIONS =============
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ticket_id INT NULL,
    type_notification NVARCHAR(20) NOT NULL CHECK (type_notification IN ('nouveau_ticket', 'mise_a_jour', 'commentaire', 'resolution')),
    message NTEXT NOT NULL,
    lu BIT DEFAULT 0,
    date_creation DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date_creation);

-- ============= TABLE STATISTIQUES =============
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

-- Créer un utilisateur admin par défaut (mot de passe: admin123)
-- Hash bcrypt de 'admin123': $2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8
INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
('Administrateur', 'admin@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'admin', 'IT'),
('Technicien Test', 'technicien@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'technicien', 'IT'),
('Utilisateur Test', 'user@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'user', 'Administration');

-- ============= VUES UTILES =============
GO

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
GO

-- Supprimer la procédure si elle existe déjà
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'CalculerStatsQuotidiennes')
    DROP PROCEDURE CalculerStatsQuotidiennes;
GO

-- Procédure pour calculer les statistiques quotidiennes
CREATE PROCEDURE CalculerStatsQuotidiennes
AS
BEGIN
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
GO

-- Supprimer les triggers s'ils existent déjà
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_date_modification')
    DROP TRIGGER trg_update_date_modification;
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_date_resolution')
    DROP TRIGGER trg_update_date_resolution;
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_create_notification_update')
    DROP TRIGGER trg_create_notification_update;
GO

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

-- ============= FIN DU SCRIPT =============

PRINT 'Base de données SQL Server créée avec succès pour le système AMNAL IT';
GO
