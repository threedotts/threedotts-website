-- Fix database functions search path to prevent schema injection attacks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix handle_new_user function with secure search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, organization_name, organization_members_count, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
    COALESCE((NEW.raw_user_meta_data->>'organization_members_count')::integer, 1),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add DELETE policies for profiles table (users can delete their own profile)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add DELETE policy for onboarding table (users can delete their own onboarding data)
CREATE POLICY "Users can delete their own onboarding" 
ON public.onboarding 
FOR DELETE 
USING (auth.uid() = user_id);