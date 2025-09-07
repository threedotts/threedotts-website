import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    // Fetch organization agent config
    const { data: config, error } = await supabase
      .from('organization_agent_config')
      .select('primary_agent_id, api_key_secret_name')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!config) {
      throw new Error('No agent configuration found for this organization');
    }

    // Get API key from environment or vault
    let apiKey = Deno.env.get(config.api_key_secret_name);
    
    if (!apiKey) {
      try {
        const { data: secretData, error: secretError } = await supabase
          .rpc('vault.read_secret', { secret_name: config.api_key_secret_name });
          
        if (secretError || !secretData) {
          throw new Error('API key not found in secrets');
        }
        
        apiKey = secretData;
      } catch (secretError) {
        throw new Error('Failed to retrieve API key from secrets');
      }
    }

    return new Response(JSON.stringify({
      agentId: config.primary_agent_id,
      apiKey: apiKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-agent-config:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});