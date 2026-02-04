-- Drop the existing check constraint and add a more flexible one with more offices
ALTER TABLE public.adjusters DROP CONSTRAINT adjusters_office_check;

-- Add the new constraint with additional offices
ALTER TABLE public.adjusters 
ADD CONSTRAINT adjusters_office_check 
CHECK (office = ANY (ARRAY['Houston'::text, 'Dallas'::text, 'Louisiana'::text, 'Austin'::text, 'San Antonio'::text, 'Other'::text]));

-- Insert the new adjusters
INSERT INTO public.adjusters (name, full_name, office, is_active) 
VALUES 
  ('David Eberly', 'David Eberly', 'Louisiana', true),
  ('Brian King', 'Brian King', 'Houston', true);