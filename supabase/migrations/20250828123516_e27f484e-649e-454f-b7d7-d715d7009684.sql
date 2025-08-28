-- Create organization_agent_config table to store agent configuration per organization
CREATE TABLE public.organization_agent_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_agent_id TEXT NOT NULL,
  api_key_secret_name TEXT NOT NULL, -- References Supabase secret name
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one active config per organization
  UNIQUE(organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.organization_agent_config ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_agent_config
CREATE POLICY "Organization owners can manage their agent config"
ON public.organization_agent_config
FOR ALL
USING (organization_id IN (
  SELECT id FROM public.organizations WHERE user_id = auth.uid()
));

CREATE POLICY "Organization members can view their agent config"
ON public.organization_agent_config
FOR SELECT
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Service role can access all agent configs"
ON public.organization_agent_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organization_agent_config_updated_at
BEFORE UPDATE ON public.organization_agent_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_organization_agent_config_org_id ON public.organization_agent_config(organization_id);
CREATE INDEX idx_organization_agent_config_status ON public.organization_agent_config(status);