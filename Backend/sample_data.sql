-- Tawasol CRM Sample Data
-- Run this after schema.sql to populate the database with test data
-- All passwords are: Password1234 (bcrypt hash)

USE tawasol_crm;

-- =====================================================
-- USERS (password: Password1234 for all)
-- =====================================================
-- Hash for 'Password1234': $2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y
INSERT INTO users (email, password, full_name, phone, user_type) VALUES
-- Organization team members
('john.smith@techcorp.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'John Smith', '+1-555-0101', 'internal'),
('sarah.jones@techcorp.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Sarah Jones', '+1-555-0102', 'internal'),
('mike.wilson@techcorp.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Mike Wilson', '+1-555-0103', 'internal'),
('emma.davis@globalbank.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Emma Davis', '+1-555-0201', 'internal'),
('david.brown@globalbank.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'David Brown', '+1-555-0202', 'internal'),
-- Client users (can be contacts in deals)
('alice.johnson@acme.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Alice Johnson', '+1-555-1001', 'client'),
('bob.miller@startup.io', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Bob Miller', '+1-555-1002', 'client'),
('carol.white@enterprise.net', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Carol White', '+1-555-1003', 'client'),
('dan.garcia@solutions.co', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Dan Garcia', '+1-555-1004', 'client'),
('eva.martinez@retail.com', '$2b$10$wEIGl1OsN78fcMad1U5KAu7myZanwdawXJxXsteC6pMOmxL3oBF7y', 'Eva Martinez', '+1-555-1005', 'client');

-- =====================================================
-- ORGANIZATIONS
-- =====================================================
INSERT INTO organizations (name, email, phone, address) VALUES
('TechCorp Solutions', 'info@techcorp.com', '+1-555-0100', '123 Tech Avenue, Silicon Valley, CA 94025'),
('Global Bank International', 'contact@globalbank.com', '+1-555-0200', '456 Finance Street, New York, NY 10001'),
('Kestrel BD', 'hello@kestrelbd.com', '+880-1700-000001', '789 Innovation Road, Dhaka, Bangladesh');

-- =====================================================
-- USER-ORGANIZATION RELATIONSHIPS
-- =====================================================
INSERT INTO user_organizations (user_id, organization_id, role) VALUES
-- TechCorp Solutions (org 1)
(1, 1, 'owner'),    -- John Smith is owner
(2, 1, 'admin'),    -- Sarah Jones is admin
(3, 1, 'agent'),    -- Mike Wilson is agent
-- Global Bank International (org 2)
(4, 2, 'owner'),    -- Emma Davis is owner
(5, 2, 'manager'),  -- David Brown is manager
-- Kestrel BD (org 3) - John also has access here
(1, 3, 'admin'),    -- John Smith is admin at Kestrel too
(2, 3, 'agent');    -- Sarah is agent at Kestrel

-- =====================================================
-- CONTACTS - PEOPLE
-- =====================================================
INSERT INTO contacts_people (organization_id, user_id, first_name, last_name, email, phone, job_title, notes, created_by_user_id) VALUES
-- TechCorp contacts (org 1)
(1, 6, 'Alice', 'Johnson', 'alice.johnson@acme.com', '+1-555-1001', 'Procurement Manager', 'Key decision maker at ACME', 1),
(1, 7, 'Bob', 'Miller', 'bob.miller@startup.io', '+1-555-1002', 'CTO', 'Technical buyer, prefers detailed specs', 1),
(1, NULL, 'Charlie', 'Brown', 'charlie@techfirm.com', '+1-555-2001', 'IT Director', 'New lead from conference', 2),
(1, NULL, 'Diana', 'Ross', 'diana@innovate.co', '+1-555-2002', 'VP Operations', 'Interested in automation solutions', 2),
-- Global Bank contacts (org 2)
(2, 8, 'Carol', 'White', 'carol.white@enterprise.net', '+1-555-1003', 'Finance Director', 'High-value prospect', 4),
(2, 9, 'Dan', 'Garcia', 'dan.garcia@solutions.co', '+1-555-1004', 'CEO', 'Strategic partnership potential', 4),
(2, NULL, 'Frank', 'Lee', 'frank@bigcorp.com', '+1-555-3001', 'CFO', 'Referred by existing client', 5),
-- Kestrel BD contacts (org 3)
(3, 10, 'Eva', 'Martinez', 'eva.martinez@retail.com', '+1-555-1005', 'Retail Manager', 'Expansion plans in Q2', 1),
(3, NULL, 'George', 'Kim', 'george@localshop.bd', '+880-1800-123456', 'Owner', 'Local business contact', 2);

-- =====================================================
-- CONTACTS - ORGANIZATIONS
-- =====================================================
INSERT INTO contacts_organizations (organization_id, linked_organization_id, name, email, phone, address, website, notes, created_by_user_id) VALUES
-- TechCorp's client organizations
(1, NULL, 'ACME Corporation', 'sales@acme.com', '+1-555-4001', '100 Main St, Austin, TX', 'www.acme.com', 'Fortune 500 company', 1),
(1, NULL, 'StartupIO Inc', 'hello@startup.io', '+1-555-4002', '50 Innovation Lane, SF, CA', 'www.startup.io', 'Fast-growing tech startup', 1),
(1, NULL, 'TechFirm LLC', 'info@techfirm.com', '+1-555-4003', '200 Tech Park, Boston, MA', 'www.techfirm.com', 'Mid-size IT company', 2),
-- Global Bank's client organizations
(2, NULL, 'Enterprise Networks', 'contact@enterprise.net', '+1-555-5001', '300 Corporate Blvd, Chicago, IL', 'www.enterprise.net', 'Telecom provider', 4),
(2, NULL, 'Solutions Co', 'info@solutions.co', '+1-555-5002', '400 Business Ave, Miami, FL', 'www.solutions.co', 'Consulting firm', 4),
-- Kestrel BD's client organizations
(3, NULL, 'RetailMax Bangladesh', 'info@retailmax.bd', '+880-1900-000001', 'Gulshan, Dhaka', 'www.retailmax.bd', 'Retail chain', 1);

-- =====================================================
-- DEALS
-- =====================================================
INSERT INTO deals (organization_id, title, value, currency, stage_id, contact_person_id, contact_org_id, assigned_to_user_id, expected_close_date, probability, notes) VALUES
-- TechCorp deals (org 1)
(1, 'ACME Enterprise License', 150000.00, 'USD', 4, 1, 1, 1, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 75, 'Final negotiation phase, legal review pending'),
(1, 'StartupIO Cloud Migration', 45000.00, 'USD', 3, 2, 2, 2, DATE_ADD(CURDATE(), INTERVAL 45 DAY), 50, 'Proposal sent, awaiting feedback'),
(1, 'TechFirm Security Package', 25000.00, 'USD', 2, 3, 3, 3, DATE_ADD(CURDATE(), INTERVAL 60 DAY), 25, 'Initial discussions going well'),
(1, 'ACME Training Program', 35000.00, 'USD', 5, 1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 100, 'Successfully closed!'),
(1, 'Lost Deal - Budget Issue', 80000.00, 'USD', 6, 4, NULL, 2, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 0, 'Client budget was reduced'),
-- Global Bank deals (org 2)
(2, 'Enterprise Networks Partnership', 500000.00, 'USD', 4, 5, 4, 4, DATE_ADD(CURDATE(), INTERVAL 20 DAY), 75, 'Major partnership deal'),
(2, 'Solutions Co Financial System', 120000.00, 'USD', 3, 6, 5, 5, DATE_ADD(CURDATE(), INTERVAL 40 DAY), 50, 'Customization requirements discussed'),
(2, 'Corporate Banking Suite', 250000.00, 'USD', 1, 7, NULL, 4, DATE_ADD(CURDATE(), INTERVAL 90 DAY), 10, 'New lead, initial contact made'),
-- Kestrel BD deals (org 3)
(3, 'RetailMax POS System', 75000.00, 'BDT', 3, 8, 6, 1, DATE_ADD(CURDATE(), INTERVAL 35 DAY), 50, 'Demo scheduled next week'),
(3, 'Local Shop Inventory System', 15000.00, 'BDT', 2, 9, NULL, 2, DATE_ADD(CURDATE(), INTERVAL 50 DAY), 25, 'Small business solution');

-- =====================================================
-- ISSUES
-- =====================================================
INSERT INTO issues (organization_id, deal_id, title, description, status, priority, assigned_to_user_id, reporter_user_id) VALUES
-- TechCorp issues (org 1)
(1, 1, 'Contract terms clarification needed', 'Client requesting changes to SLA terms in section 4.2', 'open', 'high', 1, 6),
(1, 2, 'Integration documentation request', 'StartupIO needs API documentation for their existing systems', 'in_progress', 'medium', 2, 7),
(1, 4, 'Post-sale support setup', 'Configure support portal access for ACME team', 'resolved', 'low', 3, 6),
(1, NULL, 'General inquiry about pricing', 'Prospective client asking about volume discounts', 'open', 'low', 2, 1),
-- Global Bank issues (org 2)
(2, 6, 'Security compliance verification', 'Enterprise Networks requires SOC2 compliance documentation', 'in_progress', 'critical', 4, 8),
(2, 7, 'Custom reporting requirements', 'Solutions Co needs specific financial reports not in standard package', 'open', 'high', 5, 9),
(2, NULL, 'Mobile app feature request', 'Client requesting mobile banking enhancements', 'open', 'medium', 4, 4),
-- Kestrel BD issues (org 3)
(3, 9, 'Bangla language support', 'RetailMax needs full Bangla localization for POS', 'in_progress', 'high', 1, 10),
(3, NULL, 'Training materials needed', 'Request for video tutorials in local language', 'open', 'medium', 2, 1);

-- =====================================================
-- ACTIVITIES
-- =====================================================
INSERT INTO activities (organization_id, user_id, entity_type, entity_id, action_type, description, metadata) VALUES
-- TechCorp activities
(1, 1, 'deal', 1, 'stage_change', 'Moved deal to Negotiation stage', '{"from_stage": "Proposal", "to_stage": "Negotiation"}'),
(1, 1, 'deal', 4, 'stage_change', 'Deal won! Closed successfully', '{"from_stage": "Negotiation", "to_stage": "Won"}'),
(1, 2, 'issue', 2, 'status_change', 'Started working on documentation request', '{"from_status": "open", "to_status": "in_progress"}'),
(1, 1, 'contact_person', 1, 'created', 'Added new contact Alice Johnson', NULL),
(1, 2, 'deal', 2, 'created', 'Created new deal for StartupIO', '{"value": 45000}'),
-- Global Bank activities
(2, 4, 'deal', 6, 'created', 'Created major partnership deal', '{"value": 500000}'),
(2, 4, 'issue', 5, 'assigned', 'Assigned security compliance task to self', NULL),
(2, 5, 'contact_person', 7, 'created', 'Added referral contact Frank Lee', NULL),
-- Kestrel BD activities
(3, 1, 'deal', 9, 'created', 'New deal with RetailMax', '{"value": 75000, "currency": "BDT"}'),
(3, 2, 'issue', 8, 'status_change', 'Started localization work', '{"from_status": "open", "to_status": "in_progress"}');

-- =====================================================
-- CALL LOGS
-- =====================================================
INSERT INTO call_logs (organization_id, caller_user_id, caller_type, receiver_type, receiver_user_id, receiver_contact_id, receiver_name, channel_name, started_at, ended_at, duration_seconds, status) VALUES
-- TechCorp calls
(1, 1, 'person', 'person', 6, 1, 'Alice Johnson', 'call_techcorp_001', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 15 MINUTE, 900, 'completed'),
(1, 2, 'person', 'person', 7, 2, 'Bob Miller', 'call_techcorp_002', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 MINUTE, 480, 'completed'),
(1, 1, 'person', 'person', NULL, 3, 'Charlie Brown', 'call_techcorp_003', DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL, NULL, 'missed'),
-- Global Bank calls
(2, 4, 'person', 'person', 8, 5, 'Carol White', 'call_globalbank_001', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 25 MINUTE, 1500, 'completed'),
(2, 5, 'person', 'person', 9, 6, 'Dan Garcia', 'call_globalbank_002', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR) + INTERVAL 45 MINUTE, 2700, 'completed'),
-- Kestrel BD calls
(3, 1, 'person', 'person', 10, 8, 'Eva Martinez', 'call_kestrel_001', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR) + INTERVAL 20 MINUTE, 1200, 'completed');

-- =====================================================
-- NOTIFICATIONS (sample)
-- =====================================================
INSERT INTO notifications (user_id, organization_id, type, title, message, read_at) VALUES
(1, 1, 'deal_update', 'Deal moved to Won', 'ACME Training Program has been marked as Won!', NOW()),
(1, 1, 'new_issue', 'New issue assigned', 'Contract terms clarification needed - assigned to you', NULL),
(2, 1, 'mention', 'You were mentioned', 'John mentioned you in a comment on StartupIO deal', NULL),
(4, 2, 'deal_update', 'High-value deal update', 'Enterprise Networks Partnership nearing close', NOW()),
(6, 1, 'issue_update', 'Issue status changed', 'Your issue "Contract terms clarification" is being reviewed', NULL);

-- =====================================================
-- Summary
-- =====================================================
-- Users: 10 (5 internal, 5 clients)
-- Organizations: 3
-- User-Org relationships: 7
-- Contact People: 9
-- Contact Organizations: 6
-- Deals: 10 (various stages)
-- Issues: 9
-- Activities: 10
-- Call Logs: 6
-- Notifications: 5

SELECT 'Sample data loaded successfully!' AS status;
SELECT CONCAT('Users: ', COUNT(*)) AS count FROM users;
SELECT CONCAT('Organizations: ', COUNT(*)) AS count FROM organizations;
SELECT CONCAT('Deals: ', COUNT(*)) AS count FROM deals;
SELECT CONCAT('Issues: ', COUNT(*)) AS count FROM issues;
SELECT CONCAT('Contacts (People): ', COUNT(*)) AS count FROM contacts_people;
SELECT CONCAT('Contacts (Orgs): ', COUNT(*)) AS count FROM contacts_organizations;

