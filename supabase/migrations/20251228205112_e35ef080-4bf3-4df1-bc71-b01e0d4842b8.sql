-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('sales_director', 'sales_rep');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Directors can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'sales_director'));

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity TEXT,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (
    recipient_id IN (
        SELECT id FROM public.salespeople WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (
    recipient_id IN (
        SELECT id FROM public.salespeople WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Add approval columns to sales_plans
ALTER TABLE public.sales_plans 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Update salespeople with placeholder emails
UPDATE public.salespeople SET email = 'matt.aldrich@company.com' WHERE name = 'Matt Aldrich';
UPDATE public.salespeople SET email = 'jason.riker@company.com' WHERE name = 'Jason Riker';
UPDATE public.salespeople SET email = 'richards@company.com' WHERE name = 'Richards';