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