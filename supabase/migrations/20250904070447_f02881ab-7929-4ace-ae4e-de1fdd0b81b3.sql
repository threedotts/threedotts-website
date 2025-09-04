-- Update the handle_new_user function to properly handle Google OAuth data and organization creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  org_id uuid;
  org_name text;
  user_first_name text;
  user_last_name text;
  user_avatar_url text;
BEGIN
  -- Extract user data from Google OAuth
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
    ''
  );
  
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    CASE 
      WHEN split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2) != '' 
      THEN split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2)
      ELSE ''
    END,
    ''
  );
  
  user_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert profile with Google data
  INSERT INTO public.profiles (user_id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    user_first_name,
    user_last_name,
    user_avatar_url
  );

  -- Get organization name from OAuth query params or metadata
  org_name := COALESCE(
    NEW.raw_app_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'organization_name',
    'Minha Empresa'
  );

  -- Create organization if organization_name exists in metadata or if it's a Google OAuth signup
  IF NEW.raw_user_meta_data ? 'organization_name' 
     OR NEW.raw_app_meta_data ? 'organization_name'
     OR (NEW.raw_user_meta_data ? 'provider' AND NEW.raw_user_meta_data->>'provider' = 'google') THEN
    
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
$function$;