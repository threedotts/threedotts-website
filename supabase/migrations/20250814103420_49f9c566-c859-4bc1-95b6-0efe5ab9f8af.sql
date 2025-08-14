-- Add organization_id column to call_staging table for proper access control
ALTER TABLE public.call_staging 
ADD COLUMN organization_id uuid;

-- Drop the overly permissive existing policies
DROP POLICY IF EXISTS "Authenticated users can view call staging data" ON public.call_staging;
DROP POLICY IF EXISTS "Authenticated users can insert call staging data" ON public.call_staging;
DROP POLICY IF EXISTS "Authenticated users can update call staging data" ON public.call_staging;
DROP POLICY IF EXISTS "Authenticated users can delete call staging data" ON public.call_staging;

-- Create secure organization-based RLS policies
CREATE POLICY "Users can view call staging data from their organizations" 
ON public.call_staging 
FOR SELECT 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Users can insert call staging data for their organizations" 
ON public.call_staging 
FOR INSERT 
WITH CHECK (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Users can update call staging data from their organizations" 
ON public.call_staging 
FOR UPDATE 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Users can delete call staging data from their organizations" 
ON public.call_staging 
FOR DELETE 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

-- Allow edge functions to access call staging data (needed for processing)
CREATE POLICY "Service role can manage all call staging data" 
ON public.call_staging 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);