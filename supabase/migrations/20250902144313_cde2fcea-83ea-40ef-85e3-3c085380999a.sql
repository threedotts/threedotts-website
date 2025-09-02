-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to check low credits every hour
SELECT cron.schedule(
  'check-low-credits-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/check-low-credits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXp6eXBlbWRld29teHJqZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDY2NTUsImV4cCI6MjA2NzcyMjY1NX0.2kI1aNqzqcUOYtcQPy_tVzIhzRv6hsDCP10E-KYu8iY"}'::jsonb,
        body:='{"timestamp": "' || now()::text || '", "source": "cron_job"}'::jsonb
    ) as request_id;
  $$
);