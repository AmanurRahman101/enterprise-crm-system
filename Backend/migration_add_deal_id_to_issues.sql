-- Migration: Add deal_id column to issues table
-- Run this in your MySQL database if the column doesn't exist

-- Check if column exists and add it if not
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS deal_id INT,
ADD INDEX IF NOT EXISTS idx_deal_id (deal_id),
ADD CONSTRAINT fk_issues_deal_id FOREIGN KEY IF NOT EXISTS (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

-- If the above doesn't work (older MySQL versions), use this instead:
-- ALTER TABLE issues ADD COLUMN deal_id INT;
-- ALTER TABLE issues ADD INDEX idx_deal_id (deal_id);
-- ALTER TABLE issues ADD CONSTRAINT fk_issues_deal_id FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
