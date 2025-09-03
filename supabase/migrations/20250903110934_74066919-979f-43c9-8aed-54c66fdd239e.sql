-- Limpar alertas antigos da fila que usam o formato antigo
DELETE FROM public.low_credit_alert_queue 
WHERE alert_type = 'low_credits_warning' OR alert_type IS NULL;

-- Criar estado de notificação para organizações existentes que não têm
INSERT INTO public.credit_notification_state (
  organization_id,
  current_threshold,
  last_credit_balance,
  first_warning_sent,
  zero_credits_warning_sent
)
SELECT DISTINCT
  uc.organization_id,
  COALESCE(bs.low_credit_warning_threshold, 100) as current_threshold,
  uc.current_credits as last_credit_balance,
  false as first_warning_sent,
  false as zero_credits_warning_sent
FROM public.user_credits uc
LEFT JOIN public.billing_settings bs ON bs.organization_id = uc.organization_id
WHERE uc.organization_id NOT IN (
  SELECT organization_id FROM public.credit_notification_state
);