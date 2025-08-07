-- Enable realtime for organization_members table
ALTER TABLE public.organization_members REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;