-- Atualizar todos os créditos das organizações para zero (consumir todos)
UPDATE public.user_credits 
SET 
  current_credits = 0,
  total_credits_used = total_credits_purchased,
  updated_at = now();

-- Adicionar registro de histórico para documentar esta operação
INSERT INTO public.billing_history (
  organization_id,
  type,
  amount,
  description,
  status
)
SELECT 
  organization_id,
  'usage',
  -current_credits,
  'Administrative bulk credit consumption - all credits consumed',
  'completed'
FROM public.user_credits 
WHERE current_credits > 0;