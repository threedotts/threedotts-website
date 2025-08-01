-- Criar política para permitir acesso público aos dados da organização quando acessados via convite
CREATE POLICY "Allow public access to organizations via invitation" 
ON public.organizations 
FOR SELECT 
USING (
  -- Permitir acesso se existir um convite válido (não aceito e não expirado) para esta organização
  EXISTS (
    SELECT 1 
    FROM public.organization_invitations 
    WHERE organization_invitations.organization_id = organizations.id
      AND organization_invitations.accepted_at IS NULL 
      AND organization_invitations.expires_at > now()
  )
);