-- Fix critical security vulnerability in call_transcriptions table
-- Remove overly permissive policies that allow any authenticated user access
DROP POLICY "Allow all inserts to call_transcriptions" ON public.call_transcriptions;
DROP POLICY "Allow authenticated users to delete call transcriptions" ON public.call_transcriptions;
DROP POLICY "Allow authenticated users to update call transcriptions" ON public.call_transcriptions;
DROP POLICY "Allow authenticated users to view call transcriptions" ON public.call_transcriptions;

-- Create secure organization-based RLS policies for call_transcriptions
-- Users can only view call transcriptions from organizations they belong to
CREATE POLICY "Users can view call transcriptions from their organizations" 
ON public.call_transcriptions 
FOR SELECT 
TO authenticated
USING (
  organization_id = ANY(get_user_organization_ids(auth.uid()))
);

-- Users can only insert call transcriptions for organizations they belong to
CREATE POLICY "Users can insert call transcriptions for their organizations" 
ON public.call_transcriptions 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id = ANY(get_user_organization_ids(auth.uid()))
);

-- Users can only update call transcriptions from organizations they belong to
CREATE POLICY "Users can update call transcriptions from their organizations" 
ON public.call_transcriptions 
FOR UPDATE 
TO authenticated
USING (
  organization_id = ANY(get_user_organization_ids(auth.uid()))
);

-- Users can only delete call transcriptions from organizations they belong to
CREATE POLICY "Users can delete call transcriptions from their organizations" 
ON public.call_transcriptions 
FOR DELETE 
TO authenticated
USING (
  organization_id = ANY(get_user_organization_ids(auth.uid()))
);