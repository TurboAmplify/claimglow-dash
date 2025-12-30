-- Create commission_checks table to track individual check payments
CREATE TABLE public.commission_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_commission_id uuid NOT NULL REFERENCES public.sales_commissions(id) ON DELETE CASCADE,
  check_amount numeric NOT NULL,
  received_date date NOT NULL,
  deposited_date date NOT NULL,
  check_number text,
  notes text,
  commission_earned numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated read on commission_checks"
ON public.commission_checks
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert on commission_checks"
ON public.commission_checks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on commission_checks"
ON public.commission_checks
FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on commission_checks"
ON public.commission_checks
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_commission_checks_updated_at
BEFORE UPDATE ON public.commission_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying by deposit date (for monthly reports)
CREATE INDEX idx_commission_checks_deposited_date ON public.commission_checks(deposited_date);
CREATE INDEX idx_commission_checks_sales_commission_id ON public.commission_checks(sales_commission_id);