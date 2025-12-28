-- Create sales_plans table to store user's annual plans
CREATE TABLE public.sales_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id uuid NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  year integer NOT NULL,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_commission numeric NOT NULL DEFAULT 0,
  avg_fee_percent numeric NOT NULL DEFAULT 7.5,
  commission_percent numeric NOT NULL DEFAULT 20,
  selected_scenario text NOT NULL DEFAULT 'balanced',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(salesperson_id, year)
);

-- Enable Row Level Security
ALTER TABLE public.sales_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for sales_plans
CREATE POLICY "Allow public read access on sales_plans" 
ON public.sales_plans 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert on sales_plans" 
ON public.sales_plans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sales_plans" 
ON public.sales_plans 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated delete on sales_plans" 
ON public.sales_plans 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_plans_updated_at
BEFORE UPDATE ON public.sales_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();