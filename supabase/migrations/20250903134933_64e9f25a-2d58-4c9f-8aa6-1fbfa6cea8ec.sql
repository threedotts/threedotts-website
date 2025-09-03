-- Consumir os créditos restantes da Alpha Inc. para atingir 100% de uso
-- Atualmente: 5762 usados de 6000 comprados, faltam 238 créditos
UPDATE public.user_credits 
SET 
  total_credits_used = total_credits_purchased,
  updated_at = now()
WHERE organization_id = '1e926240-b303-444b-9f8c-57abd9fa657b';