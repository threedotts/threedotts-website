-- Fix critical security issue: Remove public access to credit_notification_state table
-- This table contains sensitive financial data including credit balances and thresholds

-- Ensure RLS is enabled on the table
ALTER TABLE public.credit_notification_state ENABLE ROW LEVEL SECURITY;

-- Drop any existing public access policies that expose financial data
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.credit_notification_state;
DROP POLICY IF EXISTS "Public can view notification state" ON public.credit_notification_state;
DROP POLICY IF EXISTS "Allow anonymous access to notification state" ON public.credit_notification_state;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.credit_notification_state;
DROP POLICY IF EXISTS "Public access to credit notifications" ON public.credit_notification_state;

-- Verify that only secure policies remain:
-- The existing policy should be:
-- "Organization owners and admins can view notification state" - SELECT for owners/admins
-- "System can manage notification state" - ALL for service role

-- Add financial data access logging for compliance
CREATE TABLE IF NOT EXISTS public.financial_data_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL,
  user_id UUID,
  data_accessed JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the financial access log
ALTER TABLE public.financial_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only organization owners can view financial access logs
CREATE POLICY "Organization owners can view financial access logs" 
ON public.financial_data_access_log 
FOR SELECT 
USING (organization_id IN (
  SELECT om.organization_id FROM public.organization_members om
  WHERE om.user_id = auth.uid() 
  AND om.status = 'active' 
  AND om.role IN ('owner', 'admin')
));

-- System can insert financial access logs
CREATE POLICY "System can insert financial access logs" 
ON public.financial_data_access_log 
FOR INSERT 
WITH CHECK (true);

-- Also secure the low_credit_alert_queue table which contains similar sensitive data
ALTER TABLE public.low_credit_alert_queue ENABLE ROW LEVEL SECURITY;

-- Drop any public access policies from alert queue
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.low_credit_alert_queue;
DROP POLICY IF EXISTS "Public can view alert queue" ON public.low_credit_alert_queue;
DROP POLICY IF EXISTS "Allow anonymous access to alert queue" ON public.low_credit_alert_queue;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.low_credit_alert_queue;

-- Verify existing secure policies remain:
-- "Organization owners can view alert queue" - SELECT for owners/admins
-- "System can manage alert queue" - ALL for service role