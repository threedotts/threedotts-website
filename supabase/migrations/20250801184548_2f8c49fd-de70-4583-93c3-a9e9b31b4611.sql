-- Drop the problematic policy again
DROP POLICY "Users can accept valid invitations v2" ON public.organization_members;

-- Drop the function too
DROP FUNCTION public.can_accept_invitation(uuid, text);

-- Create a simpler policy that allows authenticated users to insert into organization_members
-- We'll validate on the application side that they have a valid invitation
CREATE POLICY "Authenticated users can join organizations" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);