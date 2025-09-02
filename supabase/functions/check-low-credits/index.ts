import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all organizations with low credits
    const { data: lowCreditOrgs, error } = await supabaseService
      .from('user_credits')
      .select(`
        *,
        billing_settings!inner(
          low_credit_warning_threshold,
          enable_low_credit_notifications,
          notification_webhook_url
        )
      `)
      .gte('current_credits', 0)
      .not('billing_settings.notification_webhook_url', 'is', null);

    if (error) {
      console.error('Error fetching low credit organizations:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to check credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    for (const org of lowCreditOrgs || []) {
      const settings = org.billing_settings;
      
      // Check if credits are below threshold and notifications are enabled
      if (
        settings.enable_low_credit_notifications &&
        org.current_credits <= settings.low_credit_warning_threshold &&
        settings.notification_webhook_url
      ) {
        try {
          // Send webhook notification to n8n
          const webhookPayload = {
            organizationId: org.organization_id,
            currentCredits: org.current_credits,
            threshold: settings.low_credit_warning_threshold,
            timestamp: new Date().toISOString(),
            type: 'low_credit_warning'
          };

          const webhookResponse = await fetch(settings.notification_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
          });

          console.log(`Webhook sent for org ${org.organization_id}:`, webhookResponse.status);
          
          notifications.push({
            organizationId: org.organization_id,
            currentCredits: org.current_credits,
            threshold: settings.low_credit_warning_threshold,
            webhookSent: webhookResponse.ok,
            webhookStatus: webhookResponse.status
          });
        } catch (webhookError) {
          console.error(`Failed to send webhook for org ${org.organization_id}:`, webhookError);
          notifications.push({
            organizationId: org.organization_id,
            currentCredits: org.current_credits,
            threshold: settings.low_credit_warning_threshold,
            webhookSent: false,
            error: webhookError.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkedOrganizations: lowCreditOrgs?.length || 0,
        sentNotifications: notifications.length,
        notifications
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in check-low-credits function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});