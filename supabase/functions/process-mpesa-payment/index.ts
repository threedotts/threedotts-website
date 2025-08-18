import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MpesaPaymentRequest {
  amount: string;
  customerMSISDN: string;
  organizationId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('M-Pesa function started');
    
    // Parse request body
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { amount, customerMSISDN, organizationId } = requestBody;
    console.log('Parsed values:', { amount, customerMSISDN, organizationId });

    console.log('Processing M-Pesa payment:', { amount, customerMSISDN, organizationId });

    // Generate unique reference for this transaction
    const transactionReference = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Call your external M-Pesa API
    const mpesaApiUrl = 'https://mpesa-sdk.onrender.com/pagar';
    
    const mpesaRequestBody = {
      amount: amount,
      valor: customerMSISDN,
      referencia: transactionReference
    };

    console.log('Calling external M-Pesa API:', mpesaApiUrl);
    console.log('Request body:', mpesaRequestBody);

    const mpesaResponse = await fetch(mpesaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mpesaRequestBody)
    });

    console.log('M-Pesa API response status:', mpesaResponse.status);

    const responseText = await mpesaResponse.text();
    console.log('M-Pesa API raw response:', responseText);

    let mpesaResult;
    try {
      mpesaResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse M-Pesa response as JSON:', parseError);
      console.error('Response text:', responseText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'M-Pesa API returned invalid response format',
          details: { 
            status: mpesaResponse.status,
            responseText: responseText.substring(0, 500)
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!mpesaResponse.ok) {
      console.error('M-Pesa API error:', mpesaResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment processing failed',
          details: mpesaResult 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if payment was successful (adjust based on your API response format)
    const isSuccess = mpesaResult.success === true || 
                     mpesaResult.status === 'success' ||
                     mpesaResult.code === '200';

    if (isSuccess) {
      console.log('Payment successful, adding credits to organization:', organizationId);
      
      // Calculate credits (assuming 1 MZN = 1 credit for now)
      const credits = parseInt(amount);
      
      // Initialize Supabase client with service role
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseServiceRole = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Add credits using the database function
      const { data: creditResult, error: creditError } = await supabaseServiceRole
        .rpc('add_credits', {
          org_id: organizationId,
          credits_to_add: credits,
          cost_amount: parseFloat(amount),
          payment_method: 'mpesa',
          payment_ref: transactionReference
        });

      if (creditError) {
        console.error('Error adding credits:', creditError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to add credits',
            details: creditError 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Credits added successfully:', creditResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          transactionReference,
          thirdPartyReference,
          creditsAdded: credits,
          mpesaResponse: mpesaResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log('Payment failed:', mpesaResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment was not successful',
          details: mpesaResult 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});