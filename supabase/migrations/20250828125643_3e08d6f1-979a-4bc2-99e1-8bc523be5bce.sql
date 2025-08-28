-- Insert sample agent configuration for the demo organization
INSERT INTO public.organization_agent_config (
  organization_id,
  primary_agent_id,
  api_key_secret_name,
  status
) VALUES (
  '1e926240-b303-444b-9f8c-57abd9fa657b',
  'agent_01k02ete3tfjgrq97y8a7v541y',
  'ELEVENLABS_API_KEY',
  'active'
);