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
    
    const { amount, customerMSISDN, organizationId }: MpesaPaymentRequest = requestBody;
    console.log('Parsed values:', { amount, customerMSISDN, organizationId });

    if (!amount || !customerMSISDN || !organizationId) {
      console.error('Missing required parameters:', { amount, customerMSISDN, organizationId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: amount, customerMSISDN, organizationId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing M-Pesa payment:', { amount, customerMSISDN, organizationId });

    // Generate unique transaction references
    const transactionReference = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const thirdPartyReference = Math.random().toString(36).substr(2, 6).toUpperCase();

    // Get environment variables
    const apiKey = Deno.env.get('MPESA_API_KEY');
    const publicKey = Deno.env.get('MPESA_PUBLIC_KEY');
    const serviceProviderCode = Deno.env.get('MPESA_SERVICE_PROVIDER_CODE');

    if (!apiKey || !publicKey || !serviceProviderCode) {
      console.error('Missing M-Pesa configuration');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'M-Pesa configuration not found' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare M-Pesa API request using the correct format from Python SDK
    const apiHost = 'api.sandbox.vm.co.mz';
    const apiPort = '18352';
    const apiPath = '/ipg/v1x/c2bPayment/singleStage/';
    
    const mpesaRequestBody = {
      input_TransactionReference: transactionReference,
      input_CustomerMSISDN: customerMSISDN,
      input_Amount: amount,
      input_ThirdPartyReference: thirdPartyReference,
      input_ServiceProviderCode: serviceProviderCode
    };

    console.log('M-Pesa API request body:', mpesaRequestBody);
    console.log('Using API endpoint:', `https://${apiHost}:${apiPort}${apiPath}`);

    // Make request to M-Pesa API using the correct endpoint format
    const mpesaResponse = await fetch(`https://${apiHost}:${apiPort}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': '*',
        // Based on Python SDK - no Bearer token, just API key as header
        'X-API-Key': apiKey
      },
      body: JSON.stringify(mpesaRequestBody)
    });

    console.log('M-Pesa API response status:', mpesaResponse.status);
    console.log('M-Pesa API response headers:', Object.fromEntries(mpesaResponse.headers.entries()));

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
            responseText: responseText.substring(0, 500) // First 500 chars for debugging
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

    // Check if payment was successful
    const isSuccess = mpesaResult.output_ResponseCode === 'INS-0' || 
                     mpesaResult.output_ResponseCode === '0' ||
                     mpesaResult.output_ResponseDesc?.toLowerCase().includes('success');

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