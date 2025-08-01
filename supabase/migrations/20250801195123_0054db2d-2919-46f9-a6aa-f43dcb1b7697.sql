-- Remove the problematic policy
DROP POLICY IF EXISTS "Organization members can view all memberships" ON public.organization_members;

-- Create security definer function to get user's organizations safely
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY(
    SELECT organization_id 
    FROM public.organization_members 
    WHERE organization_members.user_id = get_user_organization_ids.user_id 
    AND status = 'active'
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Organization members can view all memberships" 
ON public.organization_members 
FOR SELECT 
USING (
  -- Users can view their own membership
  auth.uid() = user_id 
  OR 
  -- Users can view memberships of organizations they belong to
  organization_id = ANY(public.get_user_organization_ids(auth.uid()))
);