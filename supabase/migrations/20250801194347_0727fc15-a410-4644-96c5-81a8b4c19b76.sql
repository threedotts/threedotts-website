-- Create policy to allow organization members to view their organizations
CREATE POLICY "Members can view their organizations" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);