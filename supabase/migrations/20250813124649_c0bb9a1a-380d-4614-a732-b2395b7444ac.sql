-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.consume_credits(
  org_id UUID,
  credits_to_consume INTEGER,
  call_id UUID DEFAULT NULL,
  duration_minutes INTEGER DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.add_credits(
  org_id UUID,
  credits_to_add INTEGER,
  cost_amount DECIMAL(10,2) DEFAULT NULL,
  payment_method TEXT DEFAULT NULL,
  payment_ref TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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