-- Drop the restrictive insert policy and create a more permissive one
DROP POLICY IF EXISTS "Users can insert call transcriptions for their organizations" ON public.call_transcriptions;
DROP POLICY IF EXISTS "Allow public insert access for integrations" ON public.call_transcriptions;

-- Create a new permissive insert policy that allows both authenticated users and public access
CREATE POLICY "Allow insert for users and integrations" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and organization matches their access
  (auth.uid() IS NOT NULL AND organization_id = ANY (get_user_organization_ids(auth.uid())))
  OR 
  -- Allow public access for integrations (when auth.uid() is null)
  (auth.uid() IS NULL)
);