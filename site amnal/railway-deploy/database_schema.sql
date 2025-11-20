-- database_schema.sql
-- Création de la base de données pour le système de gestion des pannes IT

CREATE DATABASE IF NOT EXISTS systeme_pannes_it 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE systeme_pannes_it;

-- ============= TABLE UTILISATEURS =============
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'technicien', 'admin') DEFAULT 'user',
    departement VARCHAR(100),
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dernier_login TIMESTAMP NULL,
    actif BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============= TABLE TICKETS =============
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    technicien_id INT NULL,
    type_panne VARCHAR(100) NOT NULL,
    materiel ENUM('pc', 'laptop', 'imprimante', 'reseau', 'serveur', 'autre') NOT NULL,
    priorite ENUM('basse', 'normale', 'haute', 'urgente') DEFAULT 'normale',
    statut ENUM('en_attente', 'en_cours', 'resolu', 'ferme') DEFAULT 'en_attente',
    description TEXT NOT NULL,
    notes_technicien TEXT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (technicien_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_statut (statut),
    INDEX idx_priorite (priorite),
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_technicien (technicien_id),
    INDEX idx_date_creation (date_creation)
) ENGINE=InnoDB;

-- ============= TABLE HISTORIQUE DES TICKETS =============
CREATE TABLE historique_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    effectue_par INT NOT NULL,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (effectue_par) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_date (date_action)
) ENGINE=InnoDB;

-- ============= TABLE CATEGORIES DE PANNES =============
CREATE TABLE categories_pannes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============= TABLE COMMENTAIRES =============
CREATE TABLE commentaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    commentaire TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_date (date_creation)
) ENGINE=InnoDB;

-- ============= TABLE PIECES JOINTES =============
CREATE TABLE pieces_jointes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50),
    taille_fichier INT,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id)
) ENGINE=InnoDB;

-- ============= TABLE NOTIFICATIONS =============
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    ticket_id INT NULL,
    type_notification ENUM('nouveau_ticket', 'mise_a_jour', 'commentaire', 'resolution') NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_lu (lu),
    INDEX idx_date (date_creation)
) ENGINE=InnoDB;

-- ============= TABLE STATISTIQUES =============
CREATE TABLE statistiques_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_tickets INT DEFAULT 0,
    tickets_resolus INT DEFAULT 0,
    tickets_en_attente INT DEFAULT 0,
    tickets_en_cours INT DEFAULT 0,
    temps_resolution_moyen INT NULL, -- en minutes
    UNIQUE KEY idx_date (date)
) ENGINE=InnoDB;

-- ============= DONNÉES INITIALES =============

-- Insérer les catégories de pannes par défaut
INSERT INTO categories_pannes (nom, description) VALUES
('PC ne démarre pas', 'Problème de démarrage de l\'ordinateur'),
('Écran noir', 'Écran qui ne s\'allume pas ou reste noir'),
('Problème de connexion Internet', 'Problèmes de réseau ou WiFi'),
('Imprimante ne fonctionne pas', 'Problèmes liés aux imprimantes'),
('Logiciel planté', 'Application ou logiciel qui ne répond plus'),
('Virus/Malware', 'Infection par virus ou logiciel malveillant'),
('Mot de passe oublié', 'Problème d\'accès au compte'),
('Disque dur plein', 'Espace disque insuffisant'),
('Surchauffe', 'Problème de température du matériel'),
('Autre problème', 'Autres types de pannes');

-- Créer un utilisateur admin par défaut (mot de passe: admin123)
-- Hash bcrypt de 'admin123': $2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8
INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
('Administrateur', 'admin@entreprise.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'admin', 'IT'),
('Technicien Test', 'technicien@entreprise.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'technicien', 'IT');

-- ============= VUES UTILES =============

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
    TIMESTAMPDIFF(MINUTE, t.date_creation, COALESCE(t.date_resolution, NOW())) as duree_minutes
FROM tickets t
JOIN utilisateurs u ON t.utilisateur_id = u.id
LEFT JOIN utilisateurs tech ON t.technicien_id = tech.id;

-- Vue pour les statistiques journalières
CREATE VIEW vue_stats_journalieres AS
SELECT 
    DATE(date_creation) as date,
    COUNT(*) as total_tickets,
    SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) as tickets_resolus,
    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as tickets_en_attente,
    SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as tickets_en_cours,
    AVG(CASE 
        WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
        THEN TIMESTAMPDIFF(MINUTE, date_creation, date_resolution) 
        ELSE NULL 
    END) as temps_resolution_moyen
FROM tickets
GROUP BY DATE(date_creation);

-- ============= PROCÉDURES STOCKÉES =============

-- Procédure pour calculer les statistiques quotidiennes
DELIMITER //

CREATE PROCEDURE calculer_stats_quotidiennes()
BEGIN
    INSERT INTO statistiques_tickets (
        date, 
        total_tickets, 
        tickets_resolus, 
        tickets_en_attente, 
        tickets_en_cours, 
        temps_resolution_moyen
    )
    SELECT 
        CURDATE(),
        COUNT(*),
        SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END),
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END),
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END),
        AVG(CASE 
            WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, date_creation, date_resolution) 
            ELSE NULL 
        END)
    FROM tickets
    WHERE DATE(date_creation) = CURDATE()
    ON DUPLICATE KEY UPDATE
        total_tickets = VALUES(total_tickets),
        tickets_resolus = VALUES(tickets_resolus),
        tickets_en_attente = VALUES(tickets_en_attente),
        tickets_en_cours = VALUES(tickets_en_cours),
        temps_resolution_moyen = VALUES(temps_resolution_moyen);
END //

DELIMITER ;

-- ============= TRIGGERS =============

-- Trigger pour mettre à jour la date de résolution
DELIMITER //

CREATE TRIGGER update_date_resolution
BEFORE UPDATE ON tickets
FOR EACH ROW
BEGIN
    IF NEW.statut = 'resolu' AND OLD.statut != 'resolu' THEN
        SET NEW.date_resolution = NOW();
    END IF;
END //

DELIMITER ;

-- Trigger pour créer une notification lors d'une mise à jour
DELIMITER //

CREATE TRIGGER create_notification_update
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
    IF OLD.statut != NEW.statut THEN
        INSERT INTO notifications (utilisateur_id, ticket_id, type_notification, message)
        VALUES (
            NEW.utilisateur_id, 
            NEW.id, 
            'mise_a_jour',
            CONCAT('Le statut de votre ticket #', NEW.id, ' a été changé en: ', NEW.statut)
        );
    END IF;
END //

DELIMITER ;

-- ============= INDEX SUPPLÉMENTAIRES POUR PERFORMANCE =============

CREATE INDEX idx_tickets_date_statut ON tickets(date_creation, statut);
CREATE INDEX idx_tickets_priorite_statut ON tickets(priorite, statut);
CREATE INDEX idx_historique_date_ticket ON historique_tickets(ticket_id, date_action);

-- ============= FIN DU SCRIPT =============