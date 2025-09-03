-- Modify consume_credits function to check low credit alerts after consumption
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
  new_balance INTEGER;
  credit_threshold INTEGER;
  notifications_enabled BOOLEAN;
BEGIN
  -- Check current balance
  SELECT current_credits INTO current_balance
  FROM public.user_credits
  WHERE organization_id = org_id;
  
  -- If insufficient credits, return false
  IF current_balance < credits_to_consume THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance after consumption
  new_balance := current_balance - credits_to_consume;
  
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
  
  -- Check if we need to trigger low credit alert
  SELECT 
    low_credit_warning_threshold,
    enable_low_credit_notifications
  INTO 
    credit_threshold,
    notifications_enabled
  FROM public.billing_settings
  WHERE organization_id = org_id;
  
  -- If notifications are enabled and we've crossed the threshold, trigger alert
  IF notifications_enabled AND credit_threshold IS NOT NULL AND new_balance <= credit_threshold THEN
    -- We need to call the edge function to send the alert
    -- Using pg_net extension to make HTTP request to our edge function
    BEGIN
      PERFORM net.http_post(
        url := 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/check-low-credits',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub' || '"}'::jsonb,
        body := '{}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the credit consumption
      RAISE WARNING 'Failed to trigger low credit alert: %', SQLERRM;
    END;
  END IF;
  
  RETURN TRUE;
END;
$$;