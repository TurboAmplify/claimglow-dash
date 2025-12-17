-- Add role and manager relationship to salespeople
ALTER TABLE public.salespeople 
ADD COLUMN role TEXT DEFAULT 'sales_rep',
ADD COLUMN manager_id UUID REFERENCES public.salespeople(id);

-- Create sales_goals table for individual targets
CREATE TABLE public.sales_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  target_revenue NUMERIC DEFAULT 0,
  target_deals INTEGER DEFAULT 0,
  goal_type TEXT NOT NULL DEFAULT 'individual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salesperson_id, year, goal_type)
);

-- Create goal_scenarios table to persist custom scenarios
CREATE TABLE public.goal_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  scenario_name TEXT NOT NULL,
  quarters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_goals
CREATE POLICY "Allow public read access on sales_goals" ON public.sales_goals
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on sales_goals" ON public.sales_goals
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sales_goals" ON public.sales_goals
FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on sales_goals" ON public.sales_goals
FOR DELETE USING (true);

-- RLS policies for goal_scenarios
CREATE POLICY "Allow public read access on goal_scenarios" ON public.goal_scenarios
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on goal_scenarios" ON public.goal_scenarios
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on goal_scenarios" ON public.goal_scenarios
FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on goal_scenarios" ON public.goal_scenarios
FOR DELETE USING (true);

-- Create trigger for updated_at on sales_goals
CREATE TRIGGER update_sales_goals_updated_at
BEFORE UPDATE ON public.sales_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on goal_scenarios
CREATE TRIGGER update_goal_scenarios_updated_at
BEFORE UPDATE ON public.goal_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();