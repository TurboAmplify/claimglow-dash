-- Add target_deals column to sales_plans table
ALTER TABLE public.sales_plans 
ADD COLUMN target_deals integer NOT NULL DEFAULT 40;