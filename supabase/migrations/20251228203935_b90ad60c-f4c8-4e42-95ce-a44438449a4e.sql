-- Create deal_pipeline table
CREATE TABLE public.deal_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  expected_value NUMERIC DEFAULT 0,
  expected_close_date DATE NOT NULL,
  stage TEXT DEFAULT 'prospect',
  probability NUMERIC DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read on deal_pipeline" 
  ON public.deal_pipeline 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated insert on deal_pipeline" 
  ON public.deal_pipeline 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on deal_pipeline" 
  ON public.deal_pipeline 
  FOR UPDATE TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated delete on deal_pipeline" 
  ON public.deal_pipeline 
  FOR DELETE TO authenticated 
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_deal_pipeline_updated_at
  BEFORE UPDATE ON public.deal_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();