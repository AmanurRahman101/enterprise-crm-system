-- Tawasol CRM Database Schema
-- Multi-tenant CRM system with unified user model and organization-based isolation

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS deal_stages;
DROP TABLE IF EXISTS contacts_organizations;
DROP TABLE IF EXISTS contacts_people;
DROP TABLE IF EXISTS user_telegram_links;
DROP TABLE IF EXISTS user_fcm_tokens;
DROP TABLE IF EXISTS user_organizations;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;

-- Users Table (Unified accounts)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    user_type ENUM('internal', 'client') NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organizations Table
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Organizations Relationship Table (Many-to-Many with roles)
CREATE TABLE user_organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    role ENUM('owner', 'admin', 'manager', 'agent', 'viewer') NOT NULL DEFAULT 'agent',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_organization (user_id, organization_id),
    INDEX idx_user_id (user_id),
    INDEX idx_organization_id (organization_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4_unicode_ci;

-- Contacts: People
CREATE TABLE contacts_people (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    user_id INT, -- Links to users table (for calling feature)
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(255),
    notes TEXT,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_organization_id (organization_id),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts: Organizations
CREATE TABLE contacts_organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    linked_organization_id INT, -- Links to organizations table (for calling feature)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    notes TEXT,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_organization_id (organization_id),
    INDEX idx_linked_organization_id (linked_organization_id),
    INDEX idx_name (name),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deal Stages (Global stages)
CREATE TABLE deal_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    order_index INT NOT NULL,
    color VARCHAR(50) DEFAULT '#6B7280',
    default_probability INT DEFAULT 0 CHECK (default_probability >= 0 AND default_probability <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_index),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default deal stages with typical probability values
INSERT INTO deal_stages (name, order_index, color, default_probability) VALUES
('Lead', 1, '#3B82F6', 10),
('Qualified', 2, '#8B5CF6', 25),
('Proposal', 3, '#F59E0B', 50),
('Negotiation', 4, '#EF4444', 75),
('Won', 5, '#10B981', 100),
('Lost', 6, '#6B7280', 0);

-- Deals Table
CREATE TABLE deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    value DECIMAL(15, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    stage_id INT NOT NULL,
    contact_person_id INT,
    contact_org_id INT,
    assigned_to_user_id INT,
    expected_close_date DATE,
    probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES deal_stages(id) ON DELETE RESTRICT,
    FOREIGN KEY (contact_person_id) REFERENCES contacts_people(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_org_id) REFERENCES contacts_organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_organization_id (organization_id),
    INDEX idx_stage_id (stage_id),
    INDEX idx_assigned_to (assigned_to_user_id),
    INDEX idx_contact_person (contact_person_id),
    INDEX idx_contact_org (contact_org_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Issues Table (Jira-ready structure)
CREATE TABLE issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    assigned_to_user_id INT,
    reporter_user_id INT NOT NULL,
    jira_project_key VARCHAR(50),
    jira_ticket_id VARCHAR(50),
    jira_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_organization_id (organization_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned_to (assigned_to_user_id),
    INDEX idx_reporter (reporter_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activities Table (Audit log)
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    user_id INT NOT NULL,
    entity_type ENUM('deal', 'contact_person', 'contact_org', 'issue', 'file', 'call') NOT NULL,
    entity_id INT,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_organization_id (organization_id),
    INDEX idx_user_id (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files Table
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    entity_type VARCHAR(50),
    entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_organization_id (organization_id),
    INDEX idx_uploaded_by (uploaded_by_user_id),
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_organization_id (organization_id),
    INDEX idx_read_at (read_at),
    INDEX idx_delivered_at (delivered_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Telegram Links (for Telegram bot integration)
CREATE TABLE user_telegram_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_telegram_chat_id (telegram_chat_id),
    INDEX idx_verification_code (verification_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User FCM Tokens (for push notifications)
CREATE TABLE user_fcm_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    device_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_device (user_id, device_id),
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CALL LOGS TABLE (Voice Calling Feature)
-- =====================================================

CREATE TABLE IF NOT EXISTS call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    caller_user_id INT NOT NULL,
    caller_type ENUM('organization', 'person') NOT NULL,
    receiver_type ENUM('organization', 'person') NOT NULL,
    receiver_user_id INT NULL, -- Links to users table if person is linked
    receiver_organization_id INT NULL, -- Links to organizations table if organization call
    receiver_contact_id INT NULL, -- ID from contacts_people or contacts_organizations
    receiver_name VARCHAR(255), -- Name for display if contact not linked
    channel_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    status ENUM('completed', 'missed', 'rejected', 'failed', 'calling') DEFAULT 'calling',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (caller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (receiver_organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    
    INDEX idx_org_id (organization_id),
    INDEX idx_caller (caller_user_id),
    INDEX idx_receiver_user (receiver_user_id),
    INDEX idx_receiver_org (receiver_organization_id),
    INDEX idx_channel (channel_name),
    INDEX idx_started (started_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
