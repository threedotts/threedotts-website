-- Fix security vulnerability in call_staging table
-- Remove the overly permissive policy that allows all operations to everyone
DROP POLICY "Allow all operations on call_staging" ON public.call_staging;

-- Create secure RLS policies for call_staging table
-- Only authenticated users can insert call staging data (for processing calls)
CREATE POLICY "Authenticated users can insert call staging data" 
ON public.call_staging 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Only authenticated users can read call staging data
CREATE POLICY "Authenticated users can view call staging data" 
ON public.call_staging 
FOR SELECT 
TO authenticated
USING (true);

-- Only authenticated users can update call staging data (for processing status updates)
CREATE POLICY "Authenticated users can update call staging data" 
ON public.call_staging 
FOR UPDATE 
TO authenticated
USING (true);

-- Only authenticated users can delete call staging data (for cleanup)
CREATE POLICY "Authenticated users can delete call staging data" 
ON public.call_staging 
FOR DELETE 
TO authenticated
USING (true);