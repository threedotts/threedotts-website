-- Fix security issue: Remove public access to organization_agent_config table
-- This table contains sensitive agent IDs and API key secret names

-- First, ensure RLS is enabled on the table
ALTER TABLE public.organization_agent_config ENABLE ROW LEVEL SECURITY;

-- Drop any existing public access policies that might exist
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Public can view agent config" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Allow anonymous access to agent config" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.organization_agent_config;

-- Verify that only secure policies remain:
-- The existing policies should be:
-- 1. "Organization members can view their agent config" - SELECT for organization members
-- 2. "Organization owners can manage their agent config" - ALL for organization owners  
-- 3. "Service role can access all agent configs" - ALL for service role

-- Add access logging table for monitoring
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

-- Only organization owners can view access logs
CREATE POLICY "Organization owners can view agent config access logs" 
ON public.agent_config_access_log 
FOR SELECT 
USING (organization_id IN (
  SELECT id FROM public.organizations 
  WHERE user_id = auth.uid()
));

-- System can insert access logs
CREATE POLICY "System can insert agent config access logs" 
ON public.agent_config_access_log 
FOR INSERT 
WITH CHECK (true);