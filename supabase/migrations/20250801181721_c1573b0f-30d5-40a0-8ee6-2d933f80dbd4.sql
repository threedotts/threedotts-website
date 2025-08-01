-- Corrigir as funções com search_path adequado
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';