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
    console.log('Starting automated low credits check...');
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all organizations with their credits and billing settings
    const { data: organizations, error: orgError } = await supabaseService
      .from('organizations')
      .select(`
        id,
        name,
        user_id,
        user_credits (
          current_credits,
          total_credits_purchased,
          total_credits_used
        ),
        billing_settings (
          low_credit_warning_threshold,
          enable_low_credit_notifications
        ),
        organization_members (
          user_id,
          email,
          role,
          status
        )
      `);

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      throw orgError;
    }

    console.log(`Checking ${organizations?.length || 0} organizations for low credits`);

    const lowCreditAlerts = [];
    const currentTime = new Date().toISOString();

    // Check each organization for low credits
    for (const org of organizations || []) {
      const credits = org.user_credits?.[0];
      const settings = org.billing_settings?.[0];

      // Skip if no credits data or notifications disabled
      if (!credits || !settings?.enable_low_credit_notifications) {
        continue;
      }

      const currentCredits = credits.current_credits || 0;
      const threshold = settings.low_credit_warning_threshold || 100;

      console.log(`Org ${org.name}: ${currentCredits} credits (threshold: ${threshold})`);

      // Check if credits are at or below threshold
      if (currentCredits <= threshold) {
        console.log(`⚠️ LOW CREDITS ALERT: ${org.name} has ${currentCredits} credits (threshold: ${threshold})`);
        
        // Get emails of owners and admins
        const adminEmails = org.organization_members
          ?.filter(member => 
            member.status === 'active' && 
            (member.role === 'owner' || member.role === 'admin')
          )
          ?.map(member => ({
            email: member.email,
            role: member.role,
            userId: member.user_id
          })) || [];

        console.log(`Found ${adminEmails.length} admin/owner emails for ${org.name}`);
        
        lowCreditAlerts.push({
          organizationId: org.id,
          organizationName: org.name,
          userId: org.user_id,
          currentCredits: currentCredits,
          threshold: threshold,
          totalPurchased: credits.total_credits_purchased || 0,
          totalUsed: credits.total_credits_used || 0,
          timestamp: currentTime,
          alertType: 'low_credits_warning',
          adminEmails: adminEmails,
          adminCount: adminEmails.length
        });
      }
    }

    console.log(`Found ${lowCreditAlerts.length} organizations with low credits`);

    // Send alerts to webhook if any found
    if (lowCreditAlerts.length > 0) {
      console.log('Sending low credit alerts to webhook...');
      
      try {
        const webhookResponse = await fetch(
          'https://n8n.srv922768.hstgr.cloud/webhook-test/e109ee08-20c1-475f-89cb-aa8aa308081d',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alerts: lowCreditAlerts,
              totalAlertsCount: lowCreditAlerts.length,
              checkTimestamp: currentTime,
              source: 'automated_credit_monitoring',
              message: `${lowCreditAlerts.length} organization(s) have low credits`
            })
          }
        );

        if (webhookResponse.ok) {
          console.log('✅ Successfully sent low credit alerts to webhook');
        } else {
          console.error(`❌ Webhook responded with status: ${webhookResponse.status}`);
          const errorText = await webhookResponse.text();
          console.error('Webhook error response:', errorText);
        }
      } catch (webhookError) {
        console.error('❌ Failed to send webhook:', webhookError);
      }
    } else {
      console.log('✅ No organizations with low credits found');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Low credits check completed successfully',
        organizationsChecked: organizations?.length || 0,
        lowCreditAlertsFound: lowCreditAlerts.length,
        alerts: lowCreditAlerts,
        timestamp: currentTime
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in check-low-credits function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check low credits',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});