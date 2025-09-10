-- Fix critical security issue: Remove public access to organization_agent_config table
-- This table contains sensitive agent IDs and API key secret names

-- Ensure RLS is enabled on the table
ALTER TABLE public.organization_agent_config ENABLE ROW LEVEL SECURITY;

-- Drop any existing public access policies that expose sensitive configuration
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Public can view agent config" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Allow anonymous access to agent config" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Public access to agent configuration" ON public.organization_agent_config;

-- Verify that only secure policies remain:
-- The existing policies should be:
-- "Organization members can view their agent config" - SELECT for organization members
-- "Organization owners can manage their agent config" - ALL for organization owners
-- "Service role can access all agent configs" - ALL for service role

-- Add agent config access logging for security monitoring
CREATE TABLE IF NOT EXISTS public.agent_config_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the access log
ALTER TABLE public.agent_config_access_log ENABLE ROW LEVEL SECURITY;

-- Only organization owners can view agent config access logs
CREATE POLICY "Organization owners can view agent config access logs" 
ON public.agent_config_access_log 
FOR SELECT 
USING (organization_id IN (
  SELECT organizations.id FROM public.organizations
  WHERE organizations.user_id = auth.uid()
));

-- System can insert agent config access logs
CREATE POLICY "System can insert agent config access logs" 
ON public.agent_config_access_log 
FOR INSERT 
WITH CHECK (true);