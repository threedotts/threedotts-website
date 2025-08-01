-- Update profiles policy to allow organization members to see each other
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create new policy allowing organization members to view each other's profiles
CREATE POLICY "Users can view organization member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can view their own profile
  auth.uid() = user_id 
  OR 
  -- Users can view profiles of other members in their organizations
  user_id IN (
    SELECT om1.user_id 
    FROM public.organization_members om1
    INNER JOIN public.organization_members om2 
      ON om1.organization_id = om2.organization_id
    WHERE om2.user_id = auth.uid() 
      AND om1.status = 'active' 
      AND om2.status = 'active'
  )
);