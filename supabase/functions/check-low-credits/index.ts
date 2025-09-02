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
    console.log('=== Starting low credits check ===');
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Supabase client created');

    // Simple test query first
    const { data: testOrgs, error: testError } = await supabaseService
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log('✅ Database connection working, found orgs:', testOrgs?.length);

    // Get organizations with credits and settings - simplified query
    const { data: organizations, error: orgError } = await supabaseService
      .from('organizations')
      .select(`
        id,
        name,
        user_credits (
          current_credits
        ),
        billing_settings (
          low_credit_warning_threshold,
          enable_low_credit_notifications
        )
      `);

    if (orgError) {
      console.error('❌ Organizations query failed:', orgError);
      throw new Error(`Organizations query failed: ${orgError.message}`);
    }

    console.log(`✅ Found ${organizations?.length || 0} organizations`);

    const lowCreditAlerts = [];
    const currentTime = new Date().toISOString();

    // Process organizations with simple logic
    for (const org of organizations || []) {
      try {
        const credits = org.user_credits?.[0];
        const settings = org.billing_settings?.[0];

        if (!credits || !settings?.enable_low_credit_notifications) {
          console.log(`⏭️ Skipping ${org.name}: no credits data or notifications disabled`);
          continue;
        }

        const currentCredits = credits.current_credits || 0;
        const threshold = settings.low_credit_warning_threshold || 100;

        console.log(`🔍 Checking ${org.name}: ${currentCredits} vs ${threshold}`);

        if (currentCredits <= threshold) {
          console.log(`🚨 LOW CREDITS: ${org.name} (${currentCredits} <= ${threshold})`);
          
          lowCreditAlerts.push({
            organizationId: org.id,
            organizationName: org.name,
            currentCredits: currentCredits,
            threshold: threshold,
            timestamp: currentTime,
            alertType: 'low_credits_warning'
          });
        }
      } catch (orgError) {
        console.error(`❌ Error processing org ${org?.name}:`, orgError);
        continue;
      }
    }

    console.log(`📊 Found ${lowCreditAlerts.length} low credit alerts`);

    // Send webhook if alerts found
    if (lowCreditAlerts.length > 0) {
      console.log('📤 Sending webhook...');
      
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
              source: 'automated_credit_monitoring_v2'
            })
          }
        );

        console.log(`📬 Webhook status: ${webhookResponse.status}`);
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook sent successfully');
        } else {
          const errorText = await webhookResponse.text();
          console.log('⚠️ Webhook error:', errorText);
        }
      } catch (webhookError) {
        console.error('❌ Webhook failed:', webhookError);
      }
    }

    console.log('🎉 Check completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Low credits check completed',
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
    console.error('💥 FUNCTION ERROR:', error);
    console.error('💥 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Function execution failed',
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