-- Create claims_2025 table for storing adjuster claim data
CREATE TABLE public.claims_2025 (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    adjuster TEXT NOT NULL,
    office TEXT,
    date_signed DATE,
    estimate_of_loss DECIMAL(15, 2) DEFAULT 0,
    revised_estimate_of_loss DECIMAL(15, 2) DEFAULT 0,
    percent_change DECIMAL(8, 4) GENERATED ALWAYS AS (
        CASE 
            WHEN estimate_of_loss > 0 THEN 
                ((revised_estimate_of_loss - estimate_of_loss) / estimate_of_loss) * 100
            ELSE 0
        END
    ) STORED,
    dollar_difference DECIMAL(15, 2) GENERATED ALWAYS AS (
        revised_estimate_of_loss - estimate_of_loss
    ) STORED,
    change_indicator TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN revised_estimate_of_loss > estimate_of_loss THEN 'increase'
            WHEN revised_estimate_of_loss < estimate_of_loss THEN 'decrease'
            ELSE 'no_change'
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_claims_adjuster ON public.claims_2025(adjuster);
CREATE INDEX idx_claims_office ON public.claims_2025(office);
CREATE INDEX idx_claims_date ON public.claims_2025(date_signed);

-- Enable Row Level Security (public read for dashboard)
ALTER TABLE public.claims_2025 ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (dashboard is public)
CREATE POLICY "Allow public read access" 
ON public.claims_2025 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create policy for authenticated insert/update
CREATE POLICY "Allow authenticated insert" 
ON public.claims_2025 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update" 
ON public.claims_2025 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete" 
ON public.claims_2025 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON public.claims_2025
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demonstration
INSERT INTO public.claims_2025 (name, adjuster, office, date_signed, estimate_of_loss, revised_estimate_of_loss) VALUES
('Johnson Property Fire', 'Michael Chen', 'Downtown', '2025-01-15', 125000.00, 142500.00),
('Smith Water Damage', 'Michael Chen', 'Downtown', '2025-01-18', 45000.00, 38000.00),
('Williams Roof Claim', 'Sarah Martinez', 'Westside', '2025-01-20', 78000.00, 95000.00),
('Brown Storm Damage', 'Sarah Martinez', 'Westside', '2025-01-22', 156000.00, 178000.00),
('Davis Auto Collision', 'James Wilson', 'Eastside', '2025-01-25', 32000.00, 29500.00),
('Miller Home Theft', 'James Wilson', 'Eastside', '2025-01-28', 18000.00, 22000.00),
('Garcia Flood Damage', 'Emily Rodriguez', 'Downtown', '2025-02-01', 89000.00, 112000.00),
('Martinez Fire Loss', 'Emily Rodriguez', 'Downtown', '2025-02-05', 234000.00, 198000.00),
('Anderson Hail Damage', 'David Kim', 'Northside', '2025-02-08', 67000.00, 73000.00),
('Taylor Wind Damage', 'David Kim', 'Northside', '2025-02-12', 54000.00, 61000.00),
('Thomas Basement Flood', 'Michael Chen', 'Downtown', '2025-02-15', 41000.00, 48500.00),
('Jackson Pipe Burst', 'Sarah Martinez', 'Westside', '2025-02-18', 28000.00, 25000.00),
('White Lightning Strike', 'James Wilson', 'Eastside', '2025-02-22', 145000.00, 167000.00),
('Harris Vandalism', 'Emily Rodriguez', 'Downtown', '2025-02-25', 15000.00, 17500.00),
('Clark Sinkhole Damage', 'David Kim', 'Northside', '2025-03-01', 278000.00, 312000.00),
('Lewis Tree Fall', 'Michael Chen', 'Downtown', '2025-03-05', 52000.00, 48000.00),
('Walker Mold Remediation', 'Sarah Martinez', 'Westside', '2025-03-08', 38000.00, 45000.00),
('Hall Appliance Fire', 'James Wilson', 'Eastside', '2025-03-12', 19000.00, 22500.00),
('Allen Foundation Crack', 'Emily Rodriguez', 'Downtown', '2025-03-15', 95000.00, 88000.00),
('Young Electrical Fire', 'David Kim', 'Northside', '2025-03-18', 167000.00, 189000.00),
('King Hurricane Damage', 'Michael Chen', 'Downtown', '2025-03-22', 425000.00, 498000.00),
('Wright Tornado Claim', 'Sarah Martinez', 'Westside', '2025-03-25', 312000.00, 285000.00),
('Scott Pool Damage', 'James Wilson', 'Eastside', '2025-03-28', 24000.00, 28500.00),
('Green HVAC Failure', 'Emily Rodriguez', 'Downtown', '2025-04-01', 18500.00, 21000.00),
('Adams Garage Collapse', 'David Kim', 'Northside', '2025-04-05', 76000.00, 82000.00);