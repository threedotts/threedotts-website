-- Create user presence table to track online/offline status
CREATE TABLE public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies for user presence
CREATE POLICY "Users can view presence of organization members" 
ON public.user_presence 
FOR SELECT 
USING (
  user_id IN (
    SELECT om1.user_id
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om2.user_id = auth.uid() 
    AND om1.status = 'active' 
    AND om2.status = 'active'
  )
);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON public.user_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for user_presence table
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER publication supabase_realtime ADD TABLE public.user_presence;