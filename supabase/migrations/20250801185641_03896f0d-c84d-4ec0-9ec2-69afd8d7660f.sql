-- Add email column to organization_members table
ALTER TABLE organization_members 
ADD COLUMN email TEXT;

-- Update existing members with emails from invitations where possible
UPDATE organization_members om
SET email = oi.email
FROM organization_invitations oi
WHERE om.invited_by = oi.invited_by 
  AND om.organization_id = oi.organization_id
  AND om.role = oi.role
  AND oi.accepted_at IS NOT NULL;