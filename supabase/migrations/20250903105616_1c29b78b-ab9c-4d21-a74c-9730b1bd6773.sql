-- Cria tabela para rastrear estado das notificações por organização
CREATE TABLE public.credit_notification_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE,
  current_threshold INTEGER NOT NULL,
  first_warning_sent BOOLEAN NOT NULL DEFAULT false,
  zero_credits_warning_sent BOOLEAN NOT NULL DEFAULT false,
  first_warning_sent_at TIMESTAMP WITH TIME ZONE,
  zero_credits_warning_sent_at TIMESTAMP WITH TIME ZONE,
  last_credit_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilita RLS na tabela
ALTER TABLE public.credit_notification_state ENABLE ROW LEVEL SECURITY;

-- Política para que apenas owners/admins possam ver o estado das notificações
CREATE POLICY "Organization owners and admins can view notification state" 
ON public.credit_notification_state 
FOR SELECT 
USING (organization_id IN (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = auth.uid() 
    AND om.status = 'active' 
    AND om.role IN ('owner', 'admin')
));

-- Sistema pode gerenciar tudo
CREATE POLICY "System can manage notification state" 
ON public.credit_notification_state 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Função melhorada para consumir créditos com lógica inteligente de notificações
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
      new_balance
    );
    
    -- Se já cruzou o threshold na criação, marca para enviar primeira notificação
    IF new_balance <= credit_threshold THEN
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
        last_credit_balance = new_balance,
        updated_at = now()
      WHERE organization_id = org_id;
      
      -- Se já cruzou o novo threshold, marca para enviar primeira notificação
      IF new_balance <= credit_threshold THEN
        should_send_first_warning := true;
      END IF;
    ELSE
      -- Threshold não mudou, verifica lógica de notificações
      
      -- Primeira notificação: cruzou threshold pela primeira vez
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
      
      -- Atualiza saldo atual
      UPDATE public.credit_notification_state
      SET 
        last_credit_balance = new_balance,
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
      new_balance,
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

-- Atualiza função de adicionar créditos para resetar estado de notificações
CREATE OR REPLACE FUNCTION public.add_credits(
  org_id UUID, 
  credits_to_add INTEGER, 
  cost_amount NUMERIC DEFAULT NULL, 
  payment_method TEXT DEFAULT NULL, 
  payment_ref TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Adiciona créditos na tabela user_credits
  INSERT INTO public.user_credits (organization_id, current_credits, total_credits_purchased)
  VALUES (org_id, credits_to_add, credits_to_add)
  ON CONFLICT (organization_id) 
  DO UPDATE SET 
    current_credits = user_credits.current_credits + credits_to_add,
    total_credits_purchased = user_credits.total_credits_purchased + credits_to_add,
    total_credits_used = 0,  -- Reseta créditos usados no top-up
    last_top_up_at = now(),
    updated_at = now();
  
  -- Reseta estado de notificações após top-up
  UPDATE public.credit_notification_state
  SET 
    first_warning_sent = false,
    zero_credits_warning_sent = false,
    first_warning_sent_at = NULL,
    zero_credits_warning_sent_at = NULL,
    last_credit_balance = (
      SELECT current_credits 
      FROM public.user_credits 
      WHERE organization_id = org_id
    ),
    updated_at = now()
  WHERE organization_id = org_id;
  
  -- Se não existe estado, cria um novo
  INSERT INTO public.credit_notification_state (
    organization_id,
    current_threshold,
    last_credit_balance
  ) 
  SELECT 
    org_id,
    COALESCE(bs.low_credit_warning_threshold, 100),
    uc.current_credits
  FROM public.user_credits uc
  LEFT JOIN public.billing_settings bs ON bs.organization_id = org_id
  WHERE uc.organization_id = org_id
  ON CONFLICT (organization_id) DO NOTHING;
  
  -- Log no histórico de billing
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
  
  RAISE LOG 'Credits added and notification state reset for organization %', org_id;
  
  RETURN TRUE;
END;
$$;

-- Adiciona coluna alert_type na tabela de fila de alertas se não existir
ALTER TABLE public.low_credit_alert_queue 
ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'low_credits_warning';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_credit_notification_state_updated_at
  BEFORE UPDATE ON public.credit_notification_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();