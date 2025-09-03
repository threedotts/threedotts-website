import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('=== ElevenLabs Signed URL Generator with Credit Validation ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agent_id, organization_id } = await req.json();
    console.log('Generating signed URL for agent:', agent_id, 'organization:', organization_id);
    
    if (!agent_id) {
      console.log('Missing agent_id parameter');
      return new Response(
        JSON.stringify({ error: "Missing agent_id parameter" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!organization_id) {
      console.log('Missing organization_id parameter');
      return new Response(
        JSON.stringify({ error: "Missing organization_id parameter" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // LAYER 1: Check credits before generating signed URL
    console.log('Checking credits for organization:', organization_id);
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('current_credits')
      .eq('organization_id', organization_id)
      .single();

    if (creditError) {
      console.error('Error checking credits:', creditError);
      return new Response(
        JSON.stringify({ error: "Unable to verify credit balance" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!creditData || creditData.current_credits <= 0) {
      console.log('Insufficient credits. Current balance:', creditData?.current_credits || 0);
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits", 
          current_credits: creditData?.current_credits || 0,
          message: "Please top up your account to continue using AI conversations"
        }), 
        { 
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Credits available:', creditData.current_credits);

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not configured');
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('API Key configured (length):', elevenLabsApiKey.length);

    // Request signed URL from ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agent_id}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API Error: ${response.status} - ${errorText}` 
        }), 
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('✅ Signed URL generated successfully');
    
    return new Response(
      JSON.stringify(data), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in signed URL generator:', error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});