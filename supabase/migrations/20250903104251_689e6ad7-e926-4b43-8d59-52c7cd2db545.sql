-- Habilita extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cria cron job para executar check-low-credits a cada 5 minutos
SELECT cron.schedule(
  'check-low-credits-every-5-minutes',
  '*/5 * * * *', -- a cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/check-low-credits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXp6eXBlbWRld29teHJqZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDY2NTUsImV4cCI6MjA2NzcyMjY1NX0.2kI1aNqzqcUOYtcQPy_tVzIhzRv6hsDCP10E-KYu8iY"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Executa a função imediatamente para testar
SELECT
  net.http_post(
      url:='https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/check-low-credits',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXp6eXBlbWRld29teHJqZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDY2NTUsImV4cCI6MjA2NzcyMjY1NX0.2kI1aNqzqcUOYtcQPy_tVzIhzRv6hsDCP10E-KYu8iY"}'::jsonb,
      body:='{"source": "manual_test"}'::jsonb
  ) as request_id;