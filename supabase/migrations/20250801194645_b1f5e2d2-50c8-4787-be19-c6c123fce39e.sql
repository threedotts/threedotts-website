-- Remove the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Create a safer policy using a security definer function
CREATE OR REPLACE FUNCTION public.user_can_access_organization(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id 
      AND user_id = user_id 
      AND status = 'active'
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Members can view accessible organizations" 
ON public.organizations 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.user_can_access_organization(id, auth.uid())
);