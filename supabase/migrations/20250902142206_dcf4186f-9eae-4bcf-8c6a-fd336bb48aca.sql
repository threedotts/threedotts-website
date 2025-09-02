CREATE OR REPLACE FUNCTION public.add_credits(org_id uuid, credits_to_add integer, cost_amount numeric DEFAULT NULL::numeric, payment_method text DEFAULT NULL::text, payment_ref text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Add credits to user_credits table
  INSERT INTO public.user_credits (organization_id, current_credits, total_credits_purchased)
  VALUES (org_id, credits_to_add, credits_to_add)
  ON CONFLICT (organization_id) 
  DO UPDATE SET 
    current_credits = user_credits.current_credits + credits_to_add,
    total_credits_purchased = user_credits.total_credits_purchased + credits_to_add,
    total_credits_used = 0,  -- Reset used credits on top-up
    last_top_up_at = now(),
    updated_at = now();
  
  -- Log in billing history
  INSERT INTO public.billing_history (
    organization_id,
    type,
    amount,
    cost,
    payment_method,
    payment_reference,
    description,
    status
  ) VALUES (
    org_id,
    'top_up',
    credits_to_add,
    cost_amount,
    payment_method,
    payment_ref,
    'Credit top-up - ' || credits_to_add || ' credits',
    'completed'
  );
  
  RETURN TRUE;
END;
$function$