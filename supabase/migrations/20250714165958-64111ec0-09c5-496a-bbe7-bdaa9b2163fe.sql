-- Create onboarding table to store detailed organization information
CREATE TABLE public.onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_website TEXT,
  industry_sector TEXT NOT NULL,
  main_objective TEXT NOT NULL,
  monthly_call_volume TEXT NOT NULL,
  current_tools TEXT[] DEFAULT '{}',
  integration_channels TEXT[] DEFAULT '{}',
  how_found_platform TEXT,
  current_challenges TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own onboarding" 
ON public.onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding" 
ON public.onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" 
ON public.onboarding 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_onboarding_updated_at
BEFORE UPDATE ON public.onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();