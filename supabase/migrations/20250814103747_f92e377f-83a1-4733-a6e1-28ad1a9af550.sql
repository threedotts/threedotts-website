-- Add organization_id column to appointments table for proper access control
ALTER TABLE public.appointments 
ADD COLUMN organization_id uuid;

-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Create secure organization-based RLS policies
CREATE POLICY "Organization members can view their appointments" 
ON public.appointments 
FOR SELECT 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Organization members can create appointments for their organization" 
ON public.appointments 
FOR INSERT 
WITH CHECK (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Organization members can update their appointments" 
ON public.appointments 
FOR UPDATE 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Organization members can delete their appointments" 
ON public.appointments 
FOR DELETE 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

-- Allow public appointment booking through edge functions (for customer-facing forms)
CREATE POLICY "Service role can manage appointments for booking system" 
ON public.appointments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);