-- Create adjusters reference table
CREATE TABLE public.adjusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    full_name TEXT,
    office TEXT NOT NULL CHECK (office IN ('Houston', 'Dallas')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.adjusters ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on adjusters"
ON public.adjusters
FOR SELECT
USING (true);

-- Allow authenticated insert/update/delete
CREATE POLICY "Allow authenticated insert on adjusters"
ON public.adjusters
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on adjusters"
ON public.adjusters
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on adjusters"
ON public.adjusters
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_adjusters_updated_at
BEFORE UPDATE ON public.adjusters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all 13 adjusters
INSERT INTO public.adjusters (name, office, is_active) VALUES
-- Houston adjusters
('Chris E.', 'Houston', true),
('Mark L.', 'Houston', true),
('James M.', 'Houston', true),
('Artie J.', 'Houston', true),
('Dan S.', 'Houston', true),
('Art J.', 'Houston', true),
('Phil N.', 'Houston', false),
('Elizabeth A.', 'Houston', true),
-- Dallas adjusters
('Daman G.', 'Dallas', true),
('Jason S.', 'Dallas', true),
('Jeff B.', 'Dallas', true),
('Anna A.', 'Dallas', true),
('Luis E.', 'Dallas', true);

-- Update Anna's claims to Dallas office
UPDATE public.claims_2025 
SET office = 'Dallas' 
WHERE adjuster = 'Anna';

-- Standardize adjuster names in claims table to match adjusters table
UPDATE public.claims_2025 SET adjuster = 'Chris E.' WHERE adjuster = 'Chris E.';
UPDATE public.claims_2025 SET adjuster = 'James M.' WHERE adjuster = 'James';
UPDATE public.claims_2025 SET adjuster = 'Jason S.' WHERE adjuster = 'Jason';
UPDATE public.claims_2025 SET adjuster = 'Jeff B.' WHERE adjuster = 'Jeff';
UPDATE public.claims_2025 SET adjuster = 'Luis E.' WHERE adjuster = 'Luis';
UPDATE public.claims_2025 SET adjuster = 'Daman G.' WHERE adjuster = 'Daman G.';
UPDATE public.claims_2025 SET adjuster = 'Phil N.' WHERE adjuster = 'Phil';
UPDATE public.claims_2025 SET adjuster = 'Anna A.' WHERE adjuster = 'Anna';