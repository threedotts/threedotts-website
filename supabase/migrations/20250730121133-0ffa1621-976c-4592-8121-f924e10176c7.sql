-- Add organization description and domain fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN organization_description TEXT,
ADD COLUMN organization_domain TEXT;