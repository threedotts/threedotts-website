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
  console.log('=== M-Pesa Payment Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('✅ Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { amount, customerMSISDN, organizationId } = requestBody;
    console.log('Parsed values:', { amount, customerMSISDN, organizationId });

    console.log('✅ About to validate required fields...');
    if (!amount || !customerMSISDN || !organizationId) {
      console.error('Missing required fields:', { amount: !!amount, customerMSISDN: !!customerMSISDN, organizationId: !!organizationId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, customerMSISDN, and organizationId are required',
          received: { amount, customerMSISDN, organizationId }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing M-Pesa payment:', { amount, customerMSISDN, organizationId });

    // Get transaction reference from secrets
    const transactionReference = Deno.env.get('MPESA_TRANSACTION_REFERENCE') ?? '';
    
    // Call your external M-Pesa API
    const mpesaApiUrl = 'https://mpesa-sdk.onrender.com/pagar';
    
    const mpesaRequestBody = {
      msisdn: customerMSISDN,
      amount: amount,
      transaction_reference: transactionReference
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