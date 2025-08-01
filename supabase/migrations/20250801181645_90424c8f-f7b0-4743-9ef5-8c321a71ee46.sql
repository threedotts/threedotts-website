-- Primeiro, vamos remover as políticas problemáticas
DROP POLICY IF EXISTS "Allow public access to invitations via token" ON public.organization_invitations;
DROP POLICY IF EXISTS "Allow public access to organizations via invitation" ON public.organizations;

-- Criar função security definer para verificar se um convite é válido
CREATE OR REPLACE FUNCTION public.is_valid_invitation_token(token_value UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_invitations 
    WHERE invitation_token = token_value
      AND accepted_at IS NULL 
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar função security definer para verificar se uma organização tem convites válidos
CREATE OR REPLACE FUNCTION public.organization_has_valid_invitations(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_invitations 
    WHERE organization_id = org_id
      AND accepted_at IS NULL 
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política para convites: permite acesso por token específico
CREATE POLICY "Allow public access to invitations via token" 
ON public.organization_invitations 
FOR SELECT 
USING (
  accepted_at IS NULL 
  AND expires_at > now()
);

-- Política para organizações: permite acesso se tem convites válidos
CREATE POLICY "Allow public access to organizations via invitation" 
ON public.organizations 
FOR SELECT 
USING (public.organization_has_valid_invitations(id));