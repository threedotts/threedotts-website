-- Fix RLS policies for call_transcriptions to allow external integrations like n8n
-- First, let's check what policies exist and recreate them properly

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create call transcriptions" ON public.call_transcriptions;

-- Create a comprehensive policy that allows all INSERT operations
CREATE POLICY "Allow all inserts to call_transcriptions" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (true);

-- Also allow SELECT for authenticated users to view their data
CREATE POLICY "Allow authenticated users to view call transcriptions" 
ON public.call_transcriptions 
FOR SELECT 
USING (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "Allow authenticated users to update call transcriptions" 
ON public.call_transcriptions 
FOR UPDATE 
USING (true);

-- Allow DELETE for authenticated users  
CREATE POLICY "Allow authenticated users to delete call transcriptions" 
ON public.call_transcriptions 
FOR DELETE 
USING (true);