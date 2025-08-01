-- Criar política para permitir acesso público aos convites através do token
CREATE POLICY "Allow public access to invitations via token" 
ON public.organization_invitations 
FOR SELECT 
USING (
  -- Permitir acesso se o usuário está tentando acessar via token válido
  -- e o convite ainda não foi aceito
  accepted_at IS NULL 
  AND expires_at > now()
);