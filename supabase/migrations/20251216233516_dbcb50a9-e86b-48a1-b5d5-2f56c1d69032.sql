-- Create salespeople table
CREATE TABLE public.salespeople (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

-- RLS policies for salespeople
CREATE POLICY "Allow public read access on salespeople" 
ON public.salespeople FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on salespeople" 
ON public.salespeople FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on salespeople" 
ON public.salespeople FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on salespeople" 
ON public.salespeople FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_salespeople_updated_at
BEFORE UPDATE ON public.salespeople
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Matt Aldrich as primary salesperson
INSERT INTO public.salespeople (name, email, is_active) 
VALUES ('Matt Aldrich', NULL, true);

-- Create sales_commissions table
CREATE TABLE public.sales_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  adjuster TEXT,
  office TEXT,
  date_signed DATE,
  year INTEGER,
  initial_estimate NUMERIC DEFAULT 0,
  revised_estimate NUMERIC DEFAULT 0,
  percent_change NUMERIC GENERATED ALWAYS AS (
    CASE WHEN initial_estimate > 0 
    THEN ((revised_estimate - initial_estimate) / initial_estimate * 100)
    ELSE 0 END
  ) STORED,
  insurance_checks_ytd NUMERIC DEFAULT 0,
  old_remainder NUMERIC DEFAULT 0,
  new_remainder NUMERIC DEFAULT 0,
  split_percentage NUMERIC DEFAULT 100,
  fee_percentage NUMERIC DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  commissions_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_commissions
CREATE POLICY "Allow public read access on sales_commissions" 
ON public.sales_commissions FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on sales_commissions" 
ON public.sales_commissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sales_commissions" 
ON public.sales_commissions FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on sales_commissions" 
ON public.sales_commissions FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_sales_commissions_updated_at
BEFORE UPDATE ON public.sales_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for year filtering
CREATE INDEX idx_sales_commissions_year ON public.sales_commissions(year);
CREATE INDEX idx_sales_commissions_salesperson ON public.sales_commissions(salesperson_id);