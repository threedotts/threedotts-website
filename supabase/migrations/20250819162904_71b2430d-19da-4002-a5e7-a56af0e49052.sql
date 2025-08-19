-- Add public insert access to call_transcriptions table for n8n workflows
CREATE POLICY "Allow public insert access for integrations" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (true);