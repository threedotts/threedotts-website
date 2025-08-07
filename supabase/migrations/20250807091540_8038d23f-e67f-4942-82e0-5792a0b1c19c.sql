-- Update the handle_new_user function to also create organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  org_id uuid;
  org_name text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  -- Get organization name from metadata
  org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'Minha Empresa');

  -- Create organization if organization_name exists in metadata
  IF NEW.raw_user_meta_data ? 'organization_name' THEN
    INSERT INTO public.organizations (
      user_id, 
      name, 
      members_count
    ) VALUES (
      NEW.id,
      org_name,
      COALESCE((NEW.raw_user_meta_data->>'organization_members_count')::integer, 1)
    ) RETURNING id INTO org_id;

    -- Add user as active member of the organization
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at,
      email
    ) VALUES (
      org_id,
      NEW.id,
      'owner',
      'active',
      now(),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;