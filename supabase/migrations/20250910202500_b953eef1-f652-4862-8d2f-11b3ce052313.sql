-- Fix the overly permissive service role policy for organization_agent_config
-- The current policy allows public access which is a security vulnerability

-- Drop the problematic service role policy that allows public access
DROP POLICY IF EXISTS "Service role can access all agent configs" ON public.organization_agent_config;

-- Create a proper service role policy that only applies to service role authentication
-- This uses auth.role() to check for actual service role context
CREATE POLICY "Service role access for agent configs" 
ON public.organization_agent_config 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Verify the remaining policies are secure:
-- 1. "Organization members can view their agent config" - only for authenticated org members
-- 2. "Organization owners can manage their agent config" - only for org owners
-- 3. New service role policy - only for actual service role