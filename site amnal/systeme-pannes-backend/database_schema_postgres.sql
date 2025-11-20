-- database_schema_postgres.sql
-- Création de la base de données PostgreSQL pour le système de gestion des pannes IT

-- Créer la base de données (exécuter cette commande séparément en tant que superuser)
-- CREATE DATABASE systeme_pannes_it WITH ENCODING 'UTF8';

-- Se connecter à la base de données
-- \c systeme_pannes_it;

-- ============= TYPES ENUM =============
CREATE TYPE role_type AS ENUM ('user', 'technicien', 'admin');
CREATE TYPE materiel_type AS ENUM ('pc', 'laptop', 'imprimante', 'reseau', 'serveur', 'autre');
CREATE TYPE priorite_type AS ENUM ('basse', 'normale', 'haute', 'urgente');
CREATE TYPE statut_type AS ENUM ('en_attente', 'en_cours', 'resolu', 'ferme');
CREATE TYPE notification_type AS ENUM ('nouveau_ticket', 'mise_a_jour', 'commentaire', 'resolution');

-- ============= TABLE UTILISATEURS =============
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role role_type DEFAULT 'user',
    departement VARCHAR(100),
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dernier_login TIMESTAMP NULL,
    actif BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);

-- ============= TABLE TICKETS =============
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    technicien_id INTEGER NULL REFERENCES utilisateurs(id) ON DELETE SET NULL,
    type_panne VARCHAR(100) NOT NULL,
    materiel materiel_type NOT NULL,
    priorite priorite_type DEFAULT 'normale',
    statut statut_type DEFAULT 'en_attente',
    description TEXT NOT NULL,
    notes_technicien TEXT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL,
    date_resolution TIMESTAMP NULL
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
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    effectue_par INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT NULL
);

CREATE INDEX idx_historique_ticket ON historique_tickets(ticket_id);
CREATE INDEX idx_historique_date ON historique_tickets(date_action);
CREATE INDEX idx_historique_date_ticket ON historique_tickets(ticket_id, date_action);

-- ============= TABLE CATEGORIES DE PANNES =============
CREATE TABLE categories_pannes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= TABLE COMMENTAIRES =============
CREATE TABLE commentaires (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    commentaire TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commentaires_ticket ON commentaires(ticket_id);
CREATE INDEX idx_commentaires_date ON commentaires(date_creation);

-- ============= TABLE PIECES JOINTES =============
CREATE TABLE pieces_jointes (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_fichier VARCHAR(50),
    taille_fichier INTEGER,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pieces_jointes_ticket ON pieces_jointes(ticket_id);

-- ============= TABLE NOTIFICATIONS =============
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    ticket_id INTEGER NULL REFERENCES tickets(id) ON DELETE CASCADE,
    type_notification notification_type NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date_creation);

-- ============= TABLE STATISTIQUES =============
CREATE TABLE statistiques_tickets (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_tickets INTEGER DEFAULT 0,
    tickets_resolus INTEGER DEFAULT 0,
    tickets_en_attente INTEGER DEFAULT 0,
    tickets_en_cours INTEGER DEFAULT 0,
    temps_resolution_moyen INTEGER NULL -- en minutes
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
-- Hash bcrypt de 'admin123'
INSERT INTO utilisateurs (nom, email, password, role, departement) VALUES
('Administrateur', 'admin@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'admin', 'IT'),
('Technicien Test', 'technicien@amnal.dz', '$2b$10$rKqF8JZjH7hp8QmqPPr5J.fW8F8W8F8W8F8W8F8W8F8W8F8W8F8W8', 'technicien', 'IT');

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
    EXTRACT(EPOCH FROM (COALESCE(t.date_resolution, NOW()) - t.date_creation))/60 as duree_minutes
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
        THEN EXTRACT(EPOCH FROM (date_resolution - date_creation))/60
        ELSE NULL 
    END) as temps_resolution_moyen
FROM tickets
GROUP BY DATE(date_creation);

-- ============= FONCTIONS =============

-- Fonction pour calculer les statistiques quotidiennes
CREATE OR REPLACE FUNCTION calculer_stats_quotidiennes()
RETURNS VOID AS $$
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
        CURRENT_DATE,
        COUNT(*),
        SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END),
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END),
        SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END),
        AVG(CASE 
            WHEN statut = 'resolu' AND date_resolution IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (date_resolution - date_creation))/60
            ELSE NULL 
        END)
    FROM tickets
    WHERE DATE(date_creation) = CURRENT_DATE
    ON CONFLICT (date) DO UPDATE SET
        total_tickets = EXCLUDED.total_tickets,
        tickets_resolus = EXCLUDED.tickets_resolus,
        tickets_en_attente = EXCLUDED.tickets_en_attente,
        tickets_en_cours = EXCLUDED.tickets_en_cours,
        temps_resolution_moyen = EXCLUDED.temps_resolution_moyen;
END;
$$ LANGUAGE plpgsql;

-- ============= TRIGGERS =============

-- Fonction trigger pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_date_modification
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_date_modification();

-- Fonction trigger pour mettre à jour la date de résolution
CREATE OR REPLACE FUNCTION update_date_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'resolu' AND OLD.statut != 'resolu' THEN
        NEW.date_resolution = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_date_resolution
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_date_resolution();

-- Fonction trigger pour créer une notification lors d'une mise à jour
CREATE OR REPLACE FUNCTION create_notification_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.statut != NEW.statut THEN
        INSERT INTO notifications (utilisateur_id, ticket_id, type_notification, message)
        VALUES (
            NEW.utilisateur_id, 
            NEW.id, 
            'mise_a_jour',
            'Le statut de votre ticket #' || NEW.id || ' a été changé en: ' || NEW.statut
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_update
AFTER UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION create_notification_update();

-- ============= FIN DU SCRIPT =============
