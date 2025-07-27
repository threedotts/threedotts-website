-- Create call transcriptions table
CREATE TABLE public.call_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  time TIME WITHOUT TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  agent TEXT NOT NULL,
  customer TEXT NOT NULL,
  evaluation_result TEXT NOT NULL,
  summary TEXT,
  audio_storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for call transcriptions
CREATE POLICY "Users can view their own call transcriptions" 
ON public.call_transcriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own call transcriptions" 
ON public.call_transcriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call transcriptions" 
ON public.call_transcriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own call transcriptions" 
ON public.call_transcriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create transcription messages table
CREATE TABLE public.transcription_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.call_transcriptions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIME WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for messages
ALTER TABLE public.transcription_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for transcription messages
CREATE POLICY "Users can view messages for their own calls" 
ON public.transcription_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.call_transcriptions 
    WHERE id = call_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their own calls" 
ON public.transcription_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.call_transcriptions 
    WHERE id = call_id AND user_id = auth.uid()
  )
);

-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-recordings', 'call-recordings', true);

-- Create storage policies for call recordings
CREATE POLICY "Users can view call recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'call-recordings');

CREATE POLICY "Users can upload call recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'call-recordings');

-- Create indexes for better performance
CREATE INDEX idx_call_transcriptions_user_id ON public.call_transcriptions(user_id);
CREATE INDEX idx_call_transcriptions_date ON public.call_transcriptions(date);
CREATE INDEX idx_transcription_messages_call_id ON public.transcription_messages(call_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_call_transcriptions_updated_at
BEFORE UPDATE ON public.call_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();