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
  console.log('=== Credit Validator API ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization_id, action, amount = 0 } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing organization_id" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Credit validation request - Org: ${organization_id}, Action: ${action}, Amount: ${amount}`);

    switch (action) {
      case 'check':
        // Simple credit check
        const { data: creditData, error: creditError } = await supabase
          .from('user_credits')
          .select('current_credits, total_credits_purchased, total_credits_used')
          .eq('organization_id', organization_id)
          .single();

        if (creditError) {
          console.error('Error checking credits:', creditError);
          return new Response(
            JSON.stringify({ error: "Unable to check credits", has_credits: false }), 
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const hasCredits = creditData && creditData.current_credits > 0;
        console.log(`Credit check result: ${hasCredits ? 'APPROVED' : 'DENIED'} - Credits: ${creditData?.current_credits || 0}`);

        return new Response(
          JSON.stringify({ 
            has_credits: hasCredits,
            current_credits: creditData?.current_credits || 0,
            total_purchased: creditData?.total_credits_purchased || 0,
            total_used: creditData?.total_credits_used || 0
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'reserve':
        // Reserve credits for a conversation
        console.log(`Attempting to reserve ${amount} credits`);
        
        const { error: reserveError } = await supabase.rpc('consume_credits', {
          org_id: organization_id,
          credits_to_consume: amount
        });

        if (reserveError) {
          console.error('Failed to reserve credits:', reserveError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Insufficient credits to reserve",
              reserved: false 
            }), 
            { 
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log(`Successfully reserved ${amount} credits`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            reserved: true,
            amount_reserved: amount
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'validate_and_block':
        // Check credits and immediately block if insufficient
        const { data: validationData, error: validationError } = await supabase
          .from('user_credits')
          .select('current_credits')
          .eq('organization_id', organization_id)
          .single();

        const canProceed = validationData && validationData.current_credits > 0;
        
        console.log(`Validation result: ${canProceed ? 'ALLOW' : 'BLOCK'} - Credits: ${validationData?.current_credits || 0}`);

        if (!canProceed) {
          return new Response(
            JSON.stringify({ 
              blocked: true,
              reason: "insufficient_credits",
              current_credits: validationData?.current_credits || 0,
              message: "Access denied: No credits available"
            }), 
            { 
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            blocked: false,
            allowed: true,
            current_credits: validationData.current_credits
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use 'check', 'reserve', or 'validate_and_block'" }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Credit validator error:', error);
    return new Response(
      JSON.stringify({ error: `Credit validation failed: ${error.message}` }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});