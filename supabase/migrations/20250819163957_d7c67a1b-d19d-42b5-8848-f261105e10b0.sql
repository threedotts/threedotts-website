-- Create trigger function to automatically consume credits when a call is inserted
CREATE OR REPLACE FUNCTION public.auto_consume_credits_on_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  minutes_used INTEGER;
  credits_consumed INTEGER;
  success BOOLEAN;
BEGIN
  -- Skip if organization_id is not set
  IF NEW.organization_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate minutes from duration (convert seconds to minutes, round up)
  minutes_used := CEIL(NEW.duration::numeric / 60);
  
  -- For now, assuming 1 credit per minute (this can be adjusted later)
  credits_consumed := minutes_used;
  
  -- Skip if no credits to consume
  IF credits_consumed <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Call the consume_credits function
  SELECT public.consume_credits(
    NEW.organization_id,
    credits_consumed,
    NEW.id,
    minutes_used
  ) INTO success;
  
  -- Log the result
  IF success THEN
    RAISE LOG 'Successfully consumed % credits for call % (% minutes)', 
      credits_consumed, NEW.id, minutes_used;
  ELSE
    RAISE LOG 'Failed to consume credits for call % - insufficient balance', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_consume_credits ON public.call_transcriptions;

CREATE TRIGGER trigger_auto_consume_credits
  AFTER INSERT ON public.call_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_consume_credits_on_call();