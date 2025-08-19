-- Corrigir função para adicionar search_path seguro
CREATE OR REPLACE FUNCTION update_organization_members_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Atualiza a contagem de membros ativos para a organização afetada
  UPDATE public.organizations 
  SET members_count = (
    SELECT COUNT(*) 
    FROM public.organization_members 
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND status = 'active'
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;