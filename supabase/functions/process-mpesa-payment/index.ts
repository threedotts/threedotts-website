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
    // Parse request body
    const { amount, customerMSISDN, organizationId }: MpesaPaymentRequest = await req.json();

    console.log('Processing M-Pesa payment:', { amount, customerMSISDN, organizationId });

    // Generate unique transaction references
    const transactionReference = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const thirdPartyReference = Math.random().toString(36).substr(2, 6).toUpperCase();

    // Get environment variables
    const bearerToken = Deno.env.get('MPESA_BEARER_TOKEN');
    const serviceProviderCode = Deno.env.get('MPESA_SERVICE_PROVIDER_CODE');
    const apiHost = Deno.env.get('MPESA_API_HOST') || 'api.sandbox.vm.co.mz';

    if (!bearerToken || !serviceProviderCode) {
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

    // Prepare M-Pesa API request
    const mpesaPayload = {
      input_TransactionReference: transactionReference,
      input_CustomerMSISDN: customerMSISDN,
      input_Amount: amount,
      input_ThirdPartyReference: thirdPartyReference,
      input_ServiceProviderCode: serviceProviderCode
    };

    console.log('M-Pesa API payload:', mpesaPayload);

    // Make request to M-Pesa API
    const mpesaResponse = await fetch(`https://${apiHost}/ipg/v1x/c2bPayment/singleStage/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'Origin': 'developer.mpesa.vm.co.mz'
      },
      body: JSON.stringify(mpesaPayload)
    });

    const mpesaResult = await mpesaResponse.json();
    console.log('M-Pesa API response:', mpesaResult);

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