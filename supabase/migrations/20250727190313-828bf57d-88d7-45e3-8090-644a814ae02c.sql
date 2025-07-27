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

CREATE POLICY "Users can update call recordings" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'call-recordings');

-- Update the call_transcriptions table to use storage path instead
ALTER TABLE call_transcriptions 
ALTER COLUMN audio_url TYPE text,
ADD COLUMN audio_storage_path text;