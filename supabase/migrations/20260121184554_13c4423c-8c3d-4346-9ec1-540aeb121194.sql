-- Create adjuster_ratings table for salespeople to rate adjusters
CREATE TABLE public.adjuster_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_commission_id UUID NOT NULL REFERENCES public.sales_commissions(id) ON DELETE CASCADE,
  salesperson_id UUID NOT NULL,
  adjuster TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_commission_id, salesperson_id)
);

-- Enable Row Level Security
ALTER TABLE public.adjuster_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for adjuster_ratings
CREATE POLICY "Allow authenticated read on adjuster_ratings"
ON public.adjuster_ratings
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert on adjuster_ratings"
ON public.adjuster_ratings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on adjuster_ratings"
ON public.adjuster_ratings
FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated delete on adjuster_ratings"
ON public.adjuster_ratings
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_adjuster_ratings_updated_at
BEFORE UPDATE ON public.adjuster_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();