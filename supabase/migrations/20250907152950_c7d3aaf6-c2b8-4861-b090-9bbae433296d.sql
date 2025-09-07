-- Create table for organization menu visibility settings
CREATE TABLE public.organization_menu_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  menu_settings JSONB NOT NULL DEFAULT '{
    "home": false,
    "demo": false,
    "call-history": false,
    "settings": true,
    "employees": false,
    "billing": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_menu_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organization members can view menu settings" 
ON public.organization_menu_settings 
FOR SELECT 
USING (organization_id = ANY (get_user_organization_ids(auth.uid())));

CREATE POLICY "Organization owners can manage menu settings" 
ON public.organization_menu_settings 
FOR ALL 
USING (organization_id IN (
  SELECT id FROM public.organizations WHERE user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organization_menu_settings_updated_at
BEFORE UPDATE ON public.organization_menu_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for existing organizations
INSERT INTO public.organization_menu_settings (organization_id, menu_settings)
SELECT id, '{
  "home": false,
  "demo": false,
  "call-history": false,
  "settings": true,
  "employees": false,
  "billing": false
}'::jsonb
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;