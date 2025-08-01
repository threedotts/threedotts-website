-- Create policy to allow users to accept valid invitations
CREATE POLICY "Users can accept valid invitations" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.organization_invitations 
    WHERE organization_invitations.organization_id = organization_members.organization_id
      AND organization_invitations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND organization_invitations.accepted_at IS NULL 
      AND organization_invitations.expires_at > now()
  )
);