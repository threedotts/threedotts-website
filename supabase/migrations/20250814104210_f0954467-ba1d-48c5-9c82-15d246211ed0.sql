-- Remove the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage appointments for booking system" ON public.appointments;

-- Create more restrictive service role policies
-- Allow service role to only INSERT appointments (for public booking forms)
CREATE POLICY "Service role can create appointments only" 
ON public.appointments 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Allow service role to only UPDATE appointment status and notes (for processing)
CREATE POLICY "Service role can update appointment status only" 
ON public.appointments 
FOR UPDATE 
TO service_role 
USING (true)
WITH CHECK (
  -- Only allow updating specific columns, not customer data
  (OLD.name = NEW.name) AND 
  (OLD.email = NEW.email) AND 
  (OLD.phone = NEW.phone) AND
  (OLD.date = NEW.date) AND
  (OLD.time = NEW.time) AND
  (OLD.organization_id = NEW.organization_id)
);

-- Create audit log table for appointment access monitoring
CREATE TABLE IF NOT EXISTS public.appointment_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id),
  accessed_by text NOT NULL, -- 'user' or 'service_role'
  access_type text NOT NULL, -- 'create', 'read', 'update', 'delete'
  user_id uuid, -- null for service role access
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.appointment_access_log ENABLE ROW LEVEL SECURITY;

-- Only organization owners and admins can view access logs
CREATE POLICY "Organization owners can view access logs" 
ON public.appointment_access_log 
FOR SELECT 
USING (
  appointment_id IN (
    SELECT a.id 
    FROM appointments a 
    WHERE a.organization_id = ANY (get_user_organization_ids(auth.uid()))
  )
);

-- Allow system to insert access logs
CREATE POLICY "System can insert access logs" 
ON public.appointment_access_log 
FOR INSERT 
WITH CHECK (true);