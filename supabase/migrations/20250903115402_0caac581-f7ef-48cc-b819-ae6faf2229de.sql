-- Corrigir a função consume_credits - lógica de detecção de threshold estava errada
CREATE OR REPLACE FUNCTION public.consume_credits(
  org_id UUID, 
  credits_to_consume INTEGER, 
  call_id UUID DEFAULT NULL, 
  duration_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  credit_threshold INTEGER;
  notifications_enabled BOOLEAN;
  notification_state RECORD;
  should_send_first_warning BOOLEAN := false;
  should_send_zero_warning BOOLEAN := false;
BEGIN
  -- Verifica saldo atual
  SELECT current_credits INTO current_balance
  FROM public.user_credits
  WHERE organization_id = org_id;
  
  -- Se não há créditos suficientes, retorna false
  IF current_balance < credits_to_consume THEN
    RETURN FALSE;
  END IF;
  
  -- Calcula novo saldo após consumo
  new_balance := current_balance - credits_to_consume;
  
  -- Consome créditos
  UPDATE public.user_credits
  SET 
    current_credits = current_credits - credits_to_consume,
    total_credits_used = total_credits_used + credits_to_consume,
    updated_at = now()
  WHERE organization_id = org_id;
  
  -- Log de uso
  INSERT INTO public.credit_usage (
    organization_id,
    call_transcription_id,
    credits_consumed,
    call_duration_minutes
  ) VALUES (
    org_id,
    call_id,
    credits_to_consume,
    duration_minutes
  );
  
  -- Log no histórico de billing
  INSERT INTO public.billing_history (
    organization_id,
    type,
    amount,
    description
  ) VALUES (
    org_id,
    'usage',
    -credits_to_consume,
    CASE 
      WHEN call_id IS NOT NULL THEN 'AI call usage - ' || credits_to_consume || ' credits'
      ELSE 'Credit consumption - ' || credits_to_consume || ' credits'
    END
  );
  
  -- Busca configurações de notificação
  SELECT 
    low_credit_warning_threshold,
    enable_low_credit_notifications
  INTO 
    credit_threshold,
    notifications_enabled
  FROM public.billing_settings
  WHERE organization_id = org_id;
  
  -- Se notificações não estão habilitadas, para aqui
  IF NOT notifications_enabled OR credit_threshold IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Busca ou cria estado de notificação para esta organização
  SELECT * INTO notification_state
  FROM public.credit_notification_state
  WHERE organization_id = org_id;
  
  -- Se não existe, cria novo estado
  IF NOT FOUND THEN
    INSERT INTO public.credit_notification_state (
      organization_id,
      current_threshold,
      last_credit_balance
    ) VALUES (
      org_id,
      credit_threshold,
      current_balance  -- CORREÇÃO: usar saldo ANTES do consumo
    );
    
    -- Se já cruzou o threshold na criação, marca para enviar primeira notificação
    IF current_balance > credit_threshold AND new_balance <= credit_threshold THEN
      should_send_first_warning := true;
    END IF;
  ELSE
    -- Verifica se o threshold mudou (diminuiu)
    IF credit_threshold < notification_state.current_threshold THEN
      -- Threshold diminuiu, reseta estado das notificações
      UPDATE public.credit_notification_state
      SET 
        current_threshold = credit_threshold,
        first_warning_sent = false,
        zero_credits_warning_sent = false,
        first_warning_sent_at = NULL,
        zero_credits_warning_sent_at = NULL,
        last_credit_balance = current_balance,  -- CORREÇÃO: usar saldo ANTES do consumo
        updated_at = now()
      WHERE organization_id = org_id;
      
      -- Se já cruzou o novo threshold, marca para enviar primeira notificação
      IF current_balance > credit_threshold AND new_balance <= credit_threshold THEN
        should_send_first_warning := true;
      END IF;
    ELSE
      -- Threshold não mudou, verifica lógica de notificações
      
      -- CORREÇÃO PRINCIPAL: Primeira notificação - cruzou threshold pela primeira vez
      -- Compara saldo ANTES (notification_state.last_credit_balance) com saldo DEPOIS (new_balance)
      IF NOT notification_state.first_warning_sent 
         AND notification_state.last_credit_balance > credit_threshold 
         AND new_balance <= credit_threshold THEN
        should_send_first_warning := true;
      END IF;
      
      -- Segunda notificação: chegou a 0 créditos
      IF NOT notification_state.zero_credits_warning_sent 
         AND notification_state.last_credit_balance > 0 
         AND new_balance = 0 THEN
        should_send_zero_warning := true;
      END IF;
      
      -- CORREÇÃO: Atualiza last_credit_balance com o saldo ANTES do consumo
      -- Só atualiza DEPOIS de fazer todas as verificações
      UPDATE public.credit_notification_state
      SET 
        last_credit_balance = current_balance,  -- Saldo ANTES do consumo
        updated_at = now()
      WHERE organization_id = org_id;
    END IF;
  END IF;
  
  -- Envia primeira notificação se necessário
  IF should_send_first_warning THEN
    INSERT INTO public.low_credit_alert_queue (
      organization_id,
      current_credits,
      threshold,
      alert_type
    ) VALUES (
      org_id,
      new_balance,      -- Saldo atual APÓS consumo para mostrar no alerta
      credit_threshold,
      'first_warning'
    );
    
    UPDATE public.credit_notification_state
    SET 
      first_warning_sent = true,
      first_warning_sent_at = now(),
      updated_at = now()
    WHERE organization_id = org_id;
    
    RAISE LOG 'First low credit warning queued for organization % - credits: %, threshold: %', 
      org_id, new_balance, credit_threshold;
  END IF;
  
  -- Envia notificação de 0 créditos se necessário
  IF should_send_zero_warning THEN
    INSERT INTO public.low_credit_alert_queue (
      organization_id,
      current_credits,
      threshold,
      alert_type
    ) VALUES (
      org_id,
      new_balance,
      credit_threshold,
      'zero_credits'
    );
    
    UPDATE public.credit_notification_state
    SET 
      zero_credits_warning_sent = true,
      zero_credits_warning_sent_at = now(),
      updated_at = now()
    WHERE organization_id = org_id;
    
    RAISE LOG 'Zero credits warning queued for organization % - credits: %', 
      org_id, new_balance;
  END IF;
  
  RETURN TRUE;
END;
$$;