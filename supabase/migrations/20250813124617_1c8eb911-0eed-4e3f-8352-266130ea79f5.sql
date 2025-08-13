-- Create user_credits table to track current credits for each organization
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  current_credits INTEGER NOT NULL DEFAULT 0,
  total_credits_purchased INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  last_top_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create billing_history table to track all billing transactions
CREATE TABLE public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'usage', 'refund')),
  amount INTEGER NOT NULL, -- Credits amount
  cost DECIMAL(10,2), -- Actual money cost for top-ups
  currency TEXT DEFAULT 'KES',
  payment_method TEXT CHECK (payment_method IN ('mpesa', 'bank_transfer', 'system')),
  payment_reference TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_usage table to track detailed usage per call
CREATE TABLE public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  call_transcription_id UUID,
  credits_consumed INTEGER NOT NULL,
  call_duration_minutes INTEGER,
  cost_per_minute DECIMAL(10,4) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_settings table for notification preferences
CREATE TABLE public.billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  low_credit_warning_threshold INTEGER DEFAULT 100,
  enable_low_credit_notifications BOOLEAN DEFAULT true,
  notification_webhook_url TEXT,
  auto_top_up_enabled BOOLEAN DEFAULT false,
  auto_top_up_amount INTEGER,
  auto_top_up_threshold INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Organization owners and admins can manage credits" 
ON public.user_credits 
FOR ALL 
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
  )
);

-- RLS policies for billing_history
CREATE POLICY "Organization owners and admins can view billing history" 
ON public.billing_history 
FOR SELECT 
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "System can insert billing history" 
ON public.billing_history 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for credit_usage
CREATE POLICY "Organization owners and admins can view credit usage" 
ON public.credit_usage 
FOR SELECT 
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "System can insert credit usage" 
ON public.credit_usage 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for billing_settings
CREATE POLICY "Organization owners and admins can manage billing settings" 
ON public.billing_settings 
FOR ALL 
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_settings_updated_at
  BEFORE UPDATE ON public.billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to consume credits and log usage
CREATE OR REPLACE FUNCTION public.consume_credits(
  org_id UUID,
  credits_to_consume INTEGER,
  call_id UUID DEFAULT NULL,
  duration_minutes INTEGER DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT current_credits INTO current_balance
  FROM public.user_credits
  WHERE organization_id = org_id;
  
  -- If insufficient credits, return false
  IF current_balance < credits_to_consume THEN
    RETURN FALSE;
  END IF;
  
  -- Consume credits
  UPDATE public.user_credits
  SET 
    current_credits = current_credits - credits_to_consume,
    total_credits_used = total_credits_used + credits_to_consume,
    updated_at = now()
  WHERE organization_id = org_id;
  
  -- Log usage
  INSERT INTO public.credit_usage (
    organization_id,
    call_transcription_id,
    credits_consumed,
    call_duration_minutes
  ) VALUES (
    org_id,
    call_id,
    credits_to_consume,
    duration_minutes
  );
  
  -- Log in billing history
  INSERT INTO public.billing_history (
    organization_id,
    type,
    amount,
    description
  ) VALUES (
    org_id,
    'usage',
    -credits_to_consume,
    CASE 
      WHEN call_id IS NOT NULL THEN 'AI call usage - ' || credits_to_consume || ' credits'
      ELSE 'Credit consumption - ' || credits_to_consume || ' credits'
    END
  );
  
  RETURN TRUE;
END;
$$;

-- Function to add credits (top-up)
CREATE OR REPLACE FUNCTION public.add_credits(
  org_id UUID,
  credits_to_add INTEGER,
  cost_amount DECIMAL(10,2) DEFAULT NULL,
  payment_method TEXT DEFAULT NULL,
  payment_ref TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add credits to user_credits table
  INSERT INTO public.user_credits (organization_id, current_credits, total_credits_purchased)
  VALUES (org_id, credits_to_add, credits_to_add)
  ON CONFLICT (organization_id) 
  DO UPDATE SET 
    current_credits = user_credits.current_credits + credits_to_add,
    total_credits_purchased = user_credits.total_credits_purchased + credits_to_add,
    last_top_up_at = now(),
    updated_at = now();
  
  -- Log in billing history
  INSERT INTO public.billing_history (
    organization_id,
    type,
    amount,
    cost,
    payment_method,
    payment_reference,
    description,
    status
  ) VALUES (
    org_id,
    'top_up',
    credits_to_add,
    cost_amount,
    payment_method,
    payment_ref,
    'Credit top-up - ' || credits_to_add || ' credits',
    'completed'
  );
  
  RETURN TRUE;
END;
$$;