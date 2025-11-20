-- Tawasol CRM Database Schema
-- Multi-tenant CRM system with Company and Customer tables

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS company_customer_relationship;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS companies;

-- Companies Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    jitsi_voip VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company-Customer Relationship Table (Many-to-Many)
-- A customer can belong to multiple companies
-- A company can have multiple customers
CREATE TABLE company_customer_relationship (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    customer_id INT NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    notes TEXT,
    added_by_company_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by_company_id) REFERENCES companies(id) ON DELETE SET NULL,
    UNIQUE KEY unique_company_customer (company_id, customer_id),
    INDEX idx_company_id (company_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leads Table
-- Stores potential customers (leads) for each company
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost') DEFAULT 'new',
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Create a database user for the application
-- GRANT ALL PRIVILEGES ON tawasol_crm.* TO 'tawasol_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- FLUSH PRIVILEGES;

-- Sample Data (Optional - for testing)
-- INSERT INTO companies (company_name, email, password, phone, address) VALUES
-- ('Tech Solutions Inc', 'contact@techsolutions.com', '$2a$10$hashedpassword', '+1234567890', '123 Tech Street, Silicon Valley');

-- INSERT INTO customers (full_name, email, password, phone) VALUES
-- ('John Doe', 'john@example.com', '$2a$10$hashedpassword', '+0987654321');

-- INSERT INTO company_customer_relationship (company_id, customer_id, status, notes) VALUES
-- (1, 1, 'active', 'Premium customer');
