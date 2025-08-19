-- Função para atualizar a contagem de membros de uma organização
CREATE OR REPLACE FUNCTION update_organization_members_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza a contagem de membros ativos para a organização afetada
  UPDATE organizations 
  SET members_count = (
    SELECT COUNT(*) 
    FROM organization_members 
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND status = 'active'
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para INSERT
CREATE OR REPLACE TRIGGER trigger_update_members_count_on_insert
  AFTER INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_count();

-- Criar trigger para UPDATE
CREATE OR REPLACE TRIGGER trigger_update_members_count_on_update
  AFTER UPDATE ON organization_members
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_organization_members_count();

-- Criar trigger para DELETE
CREATE OR REPLACE TRIGGER trigger_update_members_count_on_delete
  AFTER DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_count();

-- Corrigir contagens existentes
UPDATE organizations 
SET members_count = (
  SELECT COUNT(*) 
  FROM organization_members 
  WHERE organization_id = organizations.id
  AND status = 'active'
),
updated_at = now();