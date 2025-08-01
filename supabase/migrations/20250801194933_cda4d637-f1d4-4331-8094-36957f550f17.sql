-- Update policy to allow all organization members to view other members
DROP POLICY IF EXISTS "Organization owners and members can view memberships" ON public.organization_members;

-- Create new policy allowing all members to see other members in the same organization
CREATE POLICY "Organization members can view all memberships" 
ON public.organization_members 
FOR SELECT 
USING (
  -- Users can view their own membership
  auth.uid() = user_id 
  OR 
  -- Users can view memberships of organizations they belong to
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);