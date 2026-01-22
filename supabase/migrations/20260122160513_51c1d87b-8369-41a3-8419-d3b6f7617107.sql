-- Add new columns for 3-question survey and milestone tracking
ALTER TABLE adjuster_ratings 
ADD COLUMN IF NOT EXISTS rating_communication integer,
ADD COLUMN IF NOT EXISTS rating_settlement integer,
ADD COLUMN IF NOT EXISTS rating_overall integer,
ADD COLUMN IF NOT EXISTS claim_milestone text DEFAULT '6_months';

-- Add constraint for rating_communication
ALTER TABLE adjuster_ratings 
ADD CONSTRAINT check_rating_communication 
CHECK (rating_communication IS NULL OR (rating_communication >= 1 AND rating_communication <= 10));

-- Add constraint for rating_settlement
ALTER TABLE adjuster_ratings 
ADD CONSTRAINT check_rating_settlement 
CHECK (rating_settlement IS NULL OR (rating_settlement >= 1 AND rating_settlement <= 10));

-- Add constraint for rating_overall
ALTER TABLE adjuster_ratings 
ADD CONSTRAINT check_rating_overall 
CHECK (rating_overall IS NULL OR (rating_overall >= 1 AND rating_overall <= 10));

-- Add completed_at timestamp to sales_commissions for tracking completion
ALTER TABLE sales_commissions 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;