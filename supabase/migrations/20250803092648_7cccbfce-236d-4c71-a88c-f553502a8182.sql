-- Add organization_id to user_presence table
ALTER TABLE public.user_presence 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Drop the unique constraint correctly
ALTER TABLE public.user_presence 
DROP CONSTRAINT user_presence_user_id_key;

-- Create new unique constraint for user_id + organization_id
ALTER TABLE public.user_presence 
ADD CONSTRAINT user_presence_user_org_unique UNIQUE (user_id, organization_id);

-- Update RLS policies to be organization-specific
DROP POLICY IF EXISTS "Users can view presence of organization members" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;

-- Create new organization-specific policies
CREATE POLICY "Users can view presence within their organizations" 
ON public.user_presence 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can manage their own presence in their organizations" 
ON public.user_presence 
FOR ALL
USING (
  auth.uid() = user_id 
  AND organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  AND organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);