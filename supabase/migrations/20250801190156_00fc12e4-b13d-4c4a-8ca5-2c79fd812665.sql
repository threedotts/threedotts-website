-- Allow organization owners to view all member data including emails
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view organization memberships" ON organization_members;

-- Create comprehensive policy that allows:
-- 1. Users to see their own memberships
-- 2. Organization owners to see all memberships in their organizations
CREATE POLICY "Organization owners and members can view memberships" 
ON organization_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  organization_id IN (
    SELECT id FROM organizations WHERE user_id = auth.uid()
  )
);

-- Also ensure organization owners can update member emails if needed
CREATE POLICY "Organization owners can update member data" 
ON organization_members 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE user_id = auth.uid()
  )
);