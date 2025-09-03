-- Sincronizar o threshold entre as tabelas
UPDATE public.credit_notification_state 
SET 
  current_threshold = 5798,  -- Atualizar para o novo valor
  first_warning_sent = false,
  zero_credits_warning_sent = false,
  first_warning_sent_at = NULL,
  zero_credits_warning_sent_at = NULL,
  last_credit_balance = 5800,  -- Manter acima do novo threshold
  updated_at = now()
WHERE organization_id = '1e926240-b303-444b-9f8c-57abd9fa657b';

-- Limpar alertas antigos que podem estar com threshold incorreto
DELETE FROM public.low_credit_alert_queue 
WHERE organization_id = '1e926240-b303-444b-9f8c-57abd9fa657b';