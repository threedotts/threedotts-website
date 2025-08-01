-- Fix RLS policies for organization_members to allow users to see organizations they are members of

-- Drop the existing policy that might be limiting access
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create new policy that allows users to see their own memberships and memberships in organizations they own
CREATE POLICY "Users can view organization memberships" 
ON organization_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  organization_id IN (
    SELECT id FROM organizations WHERE user_id = auth.uid()
  )
);

-- Also add a policy to allow viewing profiles for organization members
-- Drop existing restrictive policy on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new policy that allows users to see their own profile and profiles of people in their organizations
CREATE POLICY "Users can view profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  user_id IN (
    SELECT om.user_id 
    FROM organization_members om 
    JOIN organizations o ON om.organization_id = o.id 
    WHERE o.user_id = auth.uid() OR om.user_id = auth.uid()
  )
);