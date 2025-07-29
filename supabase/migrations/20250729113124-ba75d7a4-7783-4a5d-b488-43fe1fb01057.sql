-- Update RLS policy to allow public inserts to call_transcriptions
DROP POLICY IF EXISTS "Users can create their own call transcriptions" ON public.call_transcriptions;

CREATE POLICY "Anyone can create call transcriptions" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (true);