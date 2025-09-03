-- Alterar cron job para 2 minutos para testes mais rápidos
SELECT cron.unschedule('check-low-credits');

SELECT cron.schedule(
  'check-low-credits',
  '*/2 * * * *', -- A cada 2 minutos
  $$
  SELECT net.http_post(
    url := 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/check-low-credits',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXp6eXBlbWRld29teHJqZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDY2NTUsImV4cCI6MjA2NzcyMjY1NX0.2kI1aNqzqcUOYtcQPy_tVzIhzRv6hsDCP10E-KYu8iY", "Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Corrigir estado inicial das notificações para organizações que já estão abaixo do threshold
-- Definir last_credit_balance como um valor acima do threshold para forçar a detecção na próxima chamada
UPDATE public.credit_notification_state 
SET 
  last_credit_balance = current_threshold + 100,
  first_warning_sent = false,
  zero_credits_warning_sent = false,
  first_warning_sent_at = NULL,
  zero_credits_warning_sent_at = NULL,
  updated_at = now()
WHERE organization_id IN (
  SELECT uc.organization_id 
  FROM public.user_credits uc
  JOIN public.credit_notification_state cns ON cns.organization_id = uc.organization_id
  WHERE uc.current_credits <= cns.current_threshold
  AND cns.first_warning_sent = false
);