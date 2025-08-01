-- Insert the current organization owners as members
INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
SELECT id, user_id, 'owner'::organization_role, 'active', created_at
FROM public.organizations
WHERE user_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO UPDATE SET 
  role = 'owner'::organization_role, 
  status = 'active',
  joined_at = COALESCE(organization_members.joined_at, organizations.created_at)
FROM public.organizations
WHERE organization_members.organization_id = organizations.id;