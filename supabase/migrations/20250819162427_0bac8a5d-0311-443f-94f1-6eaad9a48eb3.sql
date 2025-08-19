-- Add public read access to call_staging table for n8n workflows
CREATE POLICY "Allow public read access for integrations" 
ON public.call_staging 
FOR SELECT 
USING (true);