-- Create call_staging table based on call_transcriptions but with modifications
CREATE TABLE public.call_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME WITHOUT TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  agent TEXT NOT NULL,
  customer TEXT NOT NULL,
  evaluation_result TEXT NOT NULL,
  summary TEXT,
  audio_storage_path TEXT,
  received_audio BOOLEAN NOT NULL DEFAULT false,
  received_metadata BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security (though this table doesn't have user_id, it's good practice)
ALTER TABLE public.call_staging ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write since there's no user_id
CREATE POLICY "Allow all operations on call_staging" 
ON public.call_staging 
FOR ALL 
USING (true)
WITH CHECK (true);