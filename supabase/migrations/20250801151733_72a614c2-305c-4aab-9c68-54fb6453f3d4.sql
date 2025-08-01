-- Insert organization owners as members if they don't exist
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT o.id, o.user_id, 'owner'::organization_role, 'active', o.created_at
FROM public.organizations o
WHERE o.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members m 
    WHERE m.organization_id = o.id AND m.user_id = o.user_id
  );