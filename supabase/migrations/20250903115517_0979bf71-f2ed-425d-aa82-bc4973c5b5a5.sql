-- Resetar o estado de notificações da Alpha Inc. para testar a correção
-- Definir last_credit_balance como um valor acima do threshold para permitir detecção na próxima chamada
UPDATE public.credit_notification_state 
SET 
  last_credit_balance = 5800,  -- Acima do threshold de 5760
  first_warning_sent = false,
  zero_credits_warning_sent = false,
  first_warning_sent_at = NULL,
  zero_credits_warning_sent_at = NULL,
  updated_at = now()
WHERE organization_id = '1e926240-b303-444b-9f8c-57abd9fa657b';

-- Limpar alertas pendentes antigos
DELETE FROM public.low_credit_alert_queue 
WHERE organization_id = '1e926240-b303-444b-9f8c-57abd9fa657b';