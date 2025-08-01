-- Drop the problematic policy
DROP POLICY "Users can accept valid invitations" ON public.organization_members;

-- Create a security definer function to check if user can accept invitation
CREATE OR REPLACE FUNCTION public.can_accept_invitation(org_id uuid, user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_invitations 
    WHERE organization_id = org_id
      AND email = user_email
      AND accepted_at IS NULL 
      AND expires_at > now()
  );
END;
$$;

-- Create new policy using the function
CREATE POLICY "Users can accept valid invitations v2" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (
  public.can_accept_invitation(
    organization_id, 
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);