-- Drop existing public read policies
DROP POLICY IF EXISTS "Allow public read access on salespeople" ON public.salespeople;
DROP POLICY IF EXISTS "Allow public read access" ON public.claims_2025;

-- Create new policies requiring authentication for SELECT
CREATE POLICY "Allow authenticated read on salespeople" 
ON public.salespeople 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read on claims_2025" 
ON public.claims_2025 
FOR SELECT 
TO authenticated
USING (true);