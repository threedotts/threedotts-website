-- Check current policies and create a completely open insert policy for integrations
DROP POLICY IF EXISTS "Allow insert for users and integrations" ON public.call_transcriptions;

-- Create a simple, permissive insert policy that allows all inserts
CREATE POLICY "Allow all inserts for integrations" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (true);

-- Also ensure we have a permissive select policy for reading
DROP POLICY IF EXISTS "Allow public read access for integrations" ON public.call_transcriptions;
CREATE POLICY "Allow public read access for integrations" 
ON public.call_transcriptions 
FOR SELECT 
USING (true);