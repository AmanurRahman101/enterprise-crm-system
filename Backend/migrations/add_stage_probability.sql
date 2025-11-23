-- Migration: Add default_probability to deal_stages
-- This allows each stage to have a default probability value that automatically applies to deals in that stage

ALTER TABLE deal_stages 
ADD COLUMN default_probability INT DEFAULT 0 
CHECK (default_probability >= 0 AND default_probability <= 100);

-- Update existing stages with typical probability values
UPDATE deal_stages SET default_probability = 10 WHERE name = 'Lead';
UPDATE deal_stages SET default_probability = 25 WHERE name = 'Qualified';
UPDATE deal_stages SET default_probability = 50 WHERE name = 'Proposal';
UPDATE deal_stages SET default_probability = 75 WHERE name = 'Negotiation';
UPDATE deal_stages SET default_probability = 100 WHERE name = 'Won';
UPDATE deal_stages SET default_probability = 0 WHERE name = 'Lost';

