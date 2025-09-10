-- Fix security issue: Remove public access to organization_agent_config table
-- This table contains sensitive agent IDs and API key secret names

-- First, ensure RLS is enabled on the table
ALTER TABLE public.organization_agent_config ENABLE ROW LEVEL SECURITY;

-- Drop any existing public access policies that might exist
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Public can view agent config" ON public.organization_agent_config;
DROP POLICY IF EXISTS "Allow anonymous access to agent config" ON public.organization_agent_config;

-- Ensure only the secure policies exist:
-- 1. Organization members can view their own agent config (already exists)
-- 2. Organization owners can manage their agent config (already exists)  
-- 3. Service role can access all configs (already exists)

-- Add logging for agent config access attempts
CREATE TABLE IF NOT EXISTS public.agent_config_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
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

-- Create trigger to log access attempts
CREATE OR REPLACE FUNCTION public.log_agent_config_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.agent_config_access_log (
    organization_id,
    accessed_by,
    access_type,
    user_id
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    CASE 
      WHEN current_user = 'service_role' THEN 'service_role'
      ELSE 'user'
    END,
    TG_OP,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to organization_agent_config table
CREATE TRIGGER log_agent_config_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.organization_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.log_agent_config_access();