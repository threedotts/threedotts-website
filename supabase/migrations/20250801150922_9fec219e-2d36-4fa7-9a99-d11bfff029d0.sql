-- Create enum for organization roles
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'manager', 'employee');

-- Create organization_members table to track who belongs to which organization
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'employee',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create invitations table for pending invites
CREATE TABLE public.organization_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'employee',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members 
FOR SELECT 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
  )
);

-- RLS Policies for organization_invitations
CREATE POLICY "Users can view invitations for their organizations" 
ON public.organization_invitations 
FOR SELECT 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage invitations" 
ON public.organization_invitations 
FOR ALL 
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_invitations_updated_at
BEFORE UPDATE ON public.organization_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert organization owners as members when creating organizations
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT id, user_id, 'owner', 'active', created_at
FROM public.organizations
WHERE user_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;