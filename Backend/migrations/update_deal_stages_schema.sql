-- Update deal_stages table to remove UNIQUE constraint on name
-- This allows multiple stages with the same name (if needed)

-- Drop the unique constraint if it exists
ALTER TABLE deal_stages DROP INDEX name;

-- Add a regular index instead (for performance, not uniqueness)
ALTER TABLE deal_stages ADD INDEX idx_name (name);

