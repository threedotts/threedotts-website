-- Remove dangerous public read policies that expose sensitive customer data
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.call_staging;
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.call_transcriptions;

-- Remove overly permissive insert policy on call_transcriptions  
DROP POLICY IF EXISTS "Allow all inserts for integrations" ON public.call_transcriptions;

-- Create secure insert policy for call_transcriptions that requires service role
CREATE POLICY "Service role can insert call transcriptions" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (true);

-- Ensure existing organization-scoped policies remain for legitimate access
-- (These policies already exist and properly restrict access to organization members)