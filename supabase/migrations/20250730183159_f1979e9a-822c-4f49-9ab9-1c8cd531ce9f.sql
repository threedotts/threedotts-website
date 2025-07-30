-- Add agent_id column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN agent_id TEXT;