-- Update existing menu settings to include all menu keys
UPDATE public.organization_menu_settings 
SET menu_settings = '{
  "home": false,
  "demo": false,
  "scheduling": false,
  "employees": false,
  "analytics": false,
  "messages": false,
  "call-history": false,
  "settings": true
}'::jsonb
WHERE menu_settings != '{
  "home": false,
  "demo": false,
  "scheduling": false,
  "employees": false,
  "analytics": false,
  "messages": false,
  "call-history": false,
  "settings": true
}'::jsonb;