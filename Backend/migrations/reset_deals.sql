-- Reset Deals: Delete all existing deals
-- This script deletes all deals to start fresh

-- Delete all deals
DELETE FROM deals;

-- Reset deal_stages to default (optional - uncomment if you want to reset stages too)
-- DELETE FROM deal_stages;
-- INSERT INTO deal_stages (name, order_index, color) VALUES
-- ('Lead', 1, '#3B82F6'),
-- ('Qualified', 2, '#8B5CF6'),
-- ('Proposal', 3, '#F59E0B'),
-- ('Negotiation', 4, '#EF4444'),
-- ('Won', 5, '#10B981'),
-- ('Lost', 6, '#6B7280');

