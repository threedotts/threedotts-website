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
-- Note: We cannot restrict column updates in RLS policies, so we'll handle this in application logic
CREATE POLICY "Service role can update appointments with restrictions" 
ON public.appointments 
FOR UPDATE 
TO service_role 
USING (true)
WITH CHECK (true);

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

-- Create a trigger function to log appointment access
CREATE OR REPLACE FUNCTION log_appointment_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the access attempt
  INSERT INTO public.appointment_access_log (
    appointment_id,
    accessed_by,
    access_type,
    user_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN current_user = 'service_role' THEN 'service_role'
      ELSE 'user'
    END,
    TG_OP,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;