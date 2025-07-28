-- Add messages JSONB column to call_transcriptions table
ALTER TABLE public.call_transcriptions 
ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from transcription_messages to JSONB format
UPDATE public.call_transcriptions 
SET messages = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'timestamp', tm.timestamp,
      'speaker', tm.speaker,
      'message', tm.message
    ) ORDER BY tm.timestamp
  ), '[]'::jsonb)
  FROM transcription_messages tm 
  WHERE tm.call_id = call_transcriptions.id
);

-- Drop the transcription_messages table
DROP TABLE IF EXISTS public.transcription_messages;