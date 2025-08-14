-- Fix the function security issue by setting proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers to log appointment access
CREATE TRIGGER appointment_access_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_access();

-- Remove service role SELECT access to prevent unauthorized data reading
-- Service role can only INSERT and UPDATE, not read existing customer data
DROP POLICY IF EXISTS "Service role can select appointments" ON public.appointments;