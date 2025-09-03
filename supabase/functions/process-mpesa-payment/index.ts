import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MpesaPaymentRequest {
  amount: string;
  minutes: number;
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
    
    const { amount, minutes, customerMSISDN, organizationId } = requestBody;
    console.log('Parsed values:', { amount, minutes, customerMSISDN, organizationId });

    console.log('✅ About to validate required fields...');
    if (!amount || !minutes || !customerMSISDN || !organizationId) {
      console.error('Missing required fields:', { amount: !!amount, minutes: !!minutes, customerMSISDN: !!customerMSISDN, organizationId: !!organizationId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: amount, minutes, customerMSISDN, and organizationId are required',
          received: { amount, minutes, customerMSISDN, organizationId }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing M-Pesa payment:', { amount, customerMSISDN, organizationId });

    // Use hardcoded transaction reference
    const transactionReference = 'T12344C';
    
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

    // Check if payment was successful based on M-Pesa response format
    const isSuccess = mpesaResult.body?.output_ResponseCode === 'INS-0' ||
                     mpesaResult.body?.output_ResponseDesc === 'Request processed successfully';

    if (isSuccess) {
      console.log('Payment successful, will add credits to organization:', organizationId);
      
      // Use the minutes from the request instead of parsing the amount
      const credits = minutes;
      
      // Start background task to add credits - don't block the response
      const addCreditsTask = async () => {
        try {
          console.log('Background task: Adding credits to organization:', organizationId);
          
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
            console.error('Background task error - Failed to add credits:', creditError);
          } else {
            console.log('Background task completed - Credits added successfully:', creditResult);
          }
        } catch (error) {
          console.error('Background task error:', error);
        }
      };

      // Start the background task without waiting for it
      EdgeRuntime.waitUntil(addCreditsTask());

      // Start webhook notification task
      const webhookTask = async () => {
        try {
          console.log('Webhook task: Sending payment notification');
          
          // Initialize Supabase client with service role
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabaseServiceRole = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );
          
          // Get organization details
          const { data: orgData, error: orgError } = await supabaseServiceRole
            .from('organizations')
            .select('id, name, description, domain, user_id, members_count, created_at')
            .eq('id', organizationId)
            .single();

          if (orgError) {
            console.error('Webhook task error - Failed to get organization:', orgError);
            return;
          }

          // Get organization owners and admins with their emails
          const { data: membersData, error: membersError } = await supabaseServiceRole
            .from('organization_members')
            .select('user_id, role, email, status, joined_at')
            .eq('organization_id', organizationId)
            .in('role', ['owner', 'admin'])
            .eq('status', 'active');

          if (membersError) {
            console.error('Webhook task error - Failed to get members:', membersError);
            return;
          }

          // Get user emails from auth.users for those who don't have email in members table
          const userIds = membersData?.filter(m => !m.email).map(m => m.user_id) || [];
          let userEmails = {};
          
          if (userIds.length > 0) {
            const { data: usersData } = await supabaseServiceRole.auth.admin.listUsers();
            usersData?.users?.forEach(user => {
              if (userIds.includes(user.id) && user.email) {
                userEmails[user.id] = user.email;
              }
            });
          }

          // Combine member data with emails
          const membersWithEmails = membersData?.map(member => ({
            ...member,
            email: member.email || userEmails[member.user_id] || null
          })) || [];

          // Get credit information
          const { data: creditsData } = await supabaseServiceRole
            .from('user_credits')
            .select('current_credits, total_credits_purchased, total_credits_used')
            .eq('organization_id', organizationId)
            .single();

          // Prepare webhook payload
          const webhookPayload = {
            event: 'mpesa_payment_success',
            timestamp: new Date().toISOString(),
            payment: {
              transactionReference,
              amount: parseFloat(amount),
              currency: 'KES',
              creditsAdded: credits,
              customerMSISDN,
              mpesaTransactionId: mpesaResult.body?.output_TransactionID,
              mpesaConversationId: mpesaResult.body?.output_ConversationID,
              mpesaThirdPartyRef: mpesaResult.body?.output_ThirdPartyReference,
              mpesaResponse: mpesaResult
            },
            organization: {
              id: orgData.id,
              name: orgData.name,
              description: orgData.description,
              domain: orgData.domain,
              membersCount: orgData.members_count,
              createdAt: orgData.created_at,
              ownerId: orgData.user_id
            },
            members: {
              owners: membersWithEmails.filter(m => m.role === 'owner'),
              admins: membersWithEmails.filter(m => m.role === 'admin'),
              emails: {
                owners: membersWithEmails.filter(m => m.role === 'owner' && m.email).map(m => m.email),
                admins: membersWithEmails.filter(m => m.role === 'admin' && m.email).map(m => m.email),
                all: membersWithEmails.filter(m => m.email).map(m => m.email)
              }
            },
            credits: {
              current: creditsData?.current_credits || 0,
              totalPurchased: creditsData?.total_credits_purchased || 0,
              totalUsed: creditsData?.total_credits_used || 0,
              addedInThisPayment: credits
            }
          };

          // Send webhook
          const webhookResponse = await fetch('https://n8n.srv922768.hstgr.cloud/webhook-test/77e7630a-938a-4510-8b38-4953fd7292ba', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          });

          if (webhookResponse.ok) {
            console.log('Webhook sent successfully');
          } else {
            console.error('Webhook failed:', webhookResponse.status, await webhookResponse.text());
          }

        } catch (error) {
          console.error('Webhook task error:', error);
        }
      };

      // Start webhook task without waiting
      EdgeRuntime.waitUntil(webhookTask());

      // Return immediate success response
      return new Response(
        JSON.stringify({ 
          success: true, 
          transactionReference,
          creditsAdded: credits,
          mpesaResponse: mpesaResult,
          message: 'Payment processed successfully, credits will be added shortly'
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