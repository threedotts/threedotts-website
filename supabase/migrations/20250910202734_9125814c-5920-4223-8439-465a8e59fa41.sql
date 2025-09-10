-- Fix critical security issue: Remove public access to organizations table
-- This prevents competitors from harvesting company information

-- First, add organization name to invitations table so invitations can work 
-- without exposing the full organizations table
ALTER TABLE public.organization_invitations 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Update existing invitations with organization names
UPDATE public.organization_invitations 
SET organization_name = (
  SELECT name 
  FROM public.organizations 
  WHERE organizations.id = organization_invitations.organization_id
)
WHERE organization_name IS NULL;

-- Drop the dangerous public access policy that exposes company data
DROP POLICY IF EXISTS "Allow public access to organizations via invitation" ON public.organizations;

-- Create a secure trigger to automatically set organization name when creating invitations
CREATE OR REPLACE FUNCTION public.set_invitation_organization_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization name from organizations table
  SELECT name INTO NEW.organization_name
  FROM public.organizations 
  WHERE id = NEW.organization_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to auto-populate organization name
CREATE TRIGGER set_invitation_org_name
  BEFORE INSERT ON public.organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invitation_organization_name();