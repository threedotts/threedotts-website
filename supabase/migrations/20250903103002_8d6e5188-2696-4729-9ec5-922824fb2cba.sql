-- Create a table to track when low credit alerts need to be sent
CREATE TABLE IF NOT EXISTS public.low_credit_alert_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  current_credits INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed'))
);

-- Enable RLS on the new table
ALTER TABLE public.low_credit_alert_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for the queue table
CREATE POLICY "Organization owners can view alert queue" 
ON public.low_credit_alert_queue 
FOR SELECT 
USING (organization_id IN (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
));

-- System can insert and update alert queue
CREATE POLICY "System can manage alert queue" 
ON public.low_credit_alert_queue 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Simplified consume_credits function that queues alerts instead of calling HTTP directly
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
  existing_alert_count INTEGER;
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
  
  -- Check if we need to queue a low credit alert
  SELECT 
    low_credit_warning_threshold,
    enable_low_credit_notifications
  INTO 
    credit_threshold,
    notifications_enabled
  FROM public.billing_settings
  WHERE organization_id = org_id;
  
  -- If notifications are enabled and we've crossed the threshold, queue alert
  IF notifications_enabled AND credit_threshold IS NOT NULL AND new_balance <= credit_threshold THEN
    -- Check if there's already a pending alert for this organization
    SELECT COUNT(*) INTO existing_alert_count
    FROM public.low_credit_alert_queue
    WHERE organization_id = org_id 
      AND status = 'pending' 
      AND created_at > (now() - INTERVAL '1 hour');
    
    -- Only create new alert if no pending alert exists in the last hour
    IF existing_alert_count = 0 THEN
      INSERT INTO public.low_credit_alert_queue (
        organization_id,
        current_credits,
        threshold
      ) VALUES (
        org_id,
        new_balance,
        credit_threshold
      );
      
      RAISE LOG 'Low credit alert queued for organization % - credits: %, threshold: %', 
        org_id, new_balance, credit_threshold;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;