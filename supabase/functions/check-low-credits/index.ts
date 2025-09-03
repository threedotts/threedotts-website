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
    console.log('🚀 === STARTING LOW CREDITS CHECK v4 ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Environment check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }
    
    console.log('✅ Environment variables present');
    console.log('🔗 Supabase URL:', supabaseUrl);

    const supabaseService = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Step 1: Test database connection
    console.log('\n🔍 STEP 1: Testing database connection...');
    try {
      const { data: testData, error: testError } = await supabaseService
        .from('organizations')
        .select('id, name')
        .limit(1);

      if (testError) {
        console.error('❌ Test connection failed:', testError);
        throw new Error(`Database connection test failed: ${testError.message}`);
      }
      console.log(`✅ Database connection OK - test returned ${testData?.length || 0} records`);
    } catch (err) {
      console.error('❌ Connection test error:', err);
      throw err;
    }

    // Step 2: Get organizations
    console.log('\n📋 STEP 2: Fetching organizations...');
    let organizations;
    try {
      const { data: orgsData, error: orgsError } = await supabaseService
        .from('organizations')
        .select('id, name, user_id');

      if (orgsError) {
        console.error('❌ Organizations query error:', orgsError);
        throw new Error(`Organizations query failed: ${orgsError.message}`);
      }
      
      organizations = orgsData || [];
      console.log(`✅ Found ${organizations.length} organizations`);
      
      for (const org of organizations) {
        console.log(`   - ${org.name} (${org.id})`);
      }
    } catch (err) {
      console.error('❌ Organizations fetch error:', err);
      throw err;
    }

    // Step 3: Get user credits
    console.log('\n💰 STEP 3: Fetching user credits...');
    let userCredits;
    try {
      const { data: creditsData, error: creditsError } = await supabaseService
        .from('user_credits')
        .select('organization_id, current_credits');

      if (creditsError) {
        console.error('❌ User credits query error:', creditsError);
        throw new Error(`User credits query failed: ${creditsError.message}`);
      }
      
      userCredits = creditsData || [];
      console.log(`✅ Found ${userCredits.length} credit records`);
      
      for (const credit of userCredits) {
        console.log(`   - Org ${credit.organization_id}: ${credit.current_credits} credits`);
      }
    } catch (err) {
      console.error('❌ User credits fetch error:', err);
      throw err;
    }

    // Step 4: Get organization members with emails (owners and admins only)
    console.log('\n👥 STEP 4: Fetching organization owners and admins with emails...');
    let organizationMembers;
    try {
      const { data: membersData, error: membersError } = await supabaseService
        .from('organization_members')
        .select('organization_id, user_id, email, role, status')
        .eq('status', 'active')
        .in('role', ['owner', 'admin']);

      if (membersError) {
        console.error('❌ Organization members query error:', membersError);
        throw new Error(`Organization members query failed: ${membersError.message}`);
      }
      
      organizationMembers = membersData || [];
      console.log(`✅ Found ${organizationMembers.length} active owners and admins`);
      
      for (const member of organizationMembers) {
        console.log(`   - Org ${member.organization_id}: ${member.email} (${member.role})`);
      }
    } catch (err) {
      console.error('❌ Organization members fetch error:', err);
      throw err;
    }

    // Step 5: Get user profiles for email fallback
    console.log('\n👤 STEP 5: Fetching user profiles for email fallback...');
    let userProfiles;
    try {
      const { data: profilesData, error: profilesError } = await supabaseService
        .from('profiles')
        .select('user_id, first_name, last_name');

      if (profilesError) {
        console.error('❌ User profiles query error:', profilesError);
        // Non-critical, continue without profiles
        userProfiles = [];
      } else {
        userProfiles = profilesData || [];
        console.log(`✅ Found ${userProfiles.length} user profiles`);
      }
    } catch (err) {
      console.error('❌ User profiles fetch error:', err);
      userProfiles = [];
    }

    // Step 6: Get user auth data for email fallback
    console.log('\n🔐 STEP 6: Preparing email resolution...');
    const userIdToEmail = new Map();
    
    // Step 7: Get billing settings
    console.log('\n⚙️ STEP 7: Fetching billing settings...');
    let billingSettings;
    try {
      const { data: settingsData, error: settingsError } = await supabaseService
        .from('billing_settings')
        .select('organization_id, low_credit_warning_threshold, enable_low_credit_notifications');

      if (settingsError) {
        console.error('❌ Billing settings query error:', settingsError);
        throw new Error(`Billing settings query failed: ${settingsError.message}`);
      }
      
      billingSettings = settingsData || [];
      console.log(`✅ Found ${billingSettings.length} billing settings`);
      
      for (const setting of billingSettings) {
        console.log(`   - Org ${setting.organization_id}: threshold=${setting.low_credit_warning_threshold}, enabled=${setting.enable_low_credit_notifications}`);
      }
    } catch (err) {
      console.error('❌ Billing settings fetch error:', err);
      throw err;
    }

    // Step 8: Process low credit alerts (scheduled check)
    console.log('\n🔄 STEP 8: Processing scheduled low credit alerts...');
    const lowCreditAlerts = [];
    const currentTime = new Date().toISOString();

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      console.log(`\n🏢 Processing [${i + 1}/${organizations.length}]: ${org.name}`);
      
      try {
        // Find credits for this organization
        const orgCredits = userCredits.find(c => c.organization_id === org.id);
        if (!orgCredits) {
          console.log(`   ⏭️ No credits record found for ${org.name}`);
          continue;
        }
        
        console.log(`   💰 Current credits: ${orgCredits.current_credits}`);
        
        // Find billing settings for this organization
        const orgSettings = billingSettings.find(s => s.organization_id === org.id);
        if (!orgSettings) {
          console.log(`   ⏭️ No billing settings found for ${org.name}`);
          continue;
        }
        
        if (!orgSettings.enable_low_credit_notifications) {
          console.log(`   ⏭️ Low credit notifications disabled for ${org.name}`);
          continue;
        }
        
        const threshold = orgSettings.low_credit_warning_threshold || 100;
        console.log(`   🎯 Warning threshold: ${threshold}`);

        // Check if credits are below threshold
        if (orgCredits.current_credits <= threshold) {
          console.log(`   🚨 LOW CREDITS ALERT: ${orgCredits.current_credits} <= ${threshold}`);
          
          // Find organization owners and admins with emails
          const orgAdmins = organizationMembers.filter(m => m.organization_id === org.id);
          console.log(`   👥 Found ${orgAdmins.length} owners/admins for ${org.name}`);
          
          // Get emails from organization_members first, then fallback approaches
          let adminEmails = [];
          
          for (const admin of orgAdmins) {
            if (admin.email) {
              adminEmails.push(admin.email);
              console.log(`   📧 Email from org_members: ${admin.email} (${admin.role})`);
            } else {
              console.log(`   ⚠️ No email in org_members for user ${admin.user_id} (${admin.role})`);
              
              // For organization owners, we can try to use a different approach
              // Since we can't query auth.users directly, we'll note this for the webhook
              if (admin.role === 'owner') {
                console.log(`   🔍 Owner without email detected - will include organization anyway`);
              }
            }
          }
          
          // If no emails found but we have admins, we should still alert about the organization
          if (adminEmails.length === 0 && orgAdmins.length > 0) {
            console.log(`   ⚠️ No emails found but ${orgAdmins.length} admins exist - including in alert anyway`);
          }
          
          console.log(`   📧 Final email list: ${adminEmails.length} emails: ${adminEmails.join(', ')}`);
          
          const alert = {
            organizationId: org.id,
            organizationName: org.name,
            currentCredits: orgCredits.current_credits,
            threshold: threshold,
            timestamp: currentTime,
            alertType: 'low_credits_warning',
            source: 'automated_monitoring',
            organizationEmails: adminEmails,
            ownersAndAdminsCount: orgAdmins.length,
            hasEmailIssues: adminEmails.length === 0 && orgAdmins.length > 0,
            adminUserIds: orgAdmins.map(a => ({ userId: a.user_id, role: a.role, hasEmail: !!a.email }))
          };
          
          lowCreditAlerts.push(alert);
          console.log(`   ✅ Alert created for ${org.name}`);
        } else {
          console.log(`   ✅ Credits OK: ${orgCredits.current_credits} > ${threshold}`);
        }
        
      } catch (orgError) {
        console.error(`   ❌ Error processing ${org.name}:`, orgError);
        continue;
      }
    }

    // Step 8b: Process queued low credit alerts (from real-time consumption)
    console.log('\n🎯 STEP 8b: Processing queued low credit alerts...');
    let queuedAlerts;
    try {
      const { data: queueData, error: queueError } = await supabaseService
        .from('low_credit_alert_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (queueError) {
        console.error('❌ Queue query error:', queueError);
        queuedAlerts = [];
      } else {
        queuedAlerts = queueData || [];
        console.log(`✅ Found ${queuedAlerts.length} queued alerts`);
      }
    } catch (err) {
      console.error('❌ Queue fetch error:', err);
      queuedAlerts = [];
    }

    // Process each queued alert
    for (const queuedAlert of queuedAlerts) {
      try {
        console.log(`\n📋 Processing queued alert for organization ${queuedAlert.organization_id}`);
        
        // Find organization info
        const org = organizations.find(o => o.id === queuedAlert.organization_id);
        if (!org) {
          console.log(`   ⚠️ Organization not found, marking as failed`);
          await supabaseService
            .from('low_credit_alert_queue')
            .update({ status: 'failed', processed_at: currentTime })
            .eq('id', queuedAlert.id);
          continue;
        }

        // Find organization owners and admins with emails
        const orgAdmins = organizationMembers.filter(m => m.organization_id === queuedAlert.organization_id);
        console.log(`   👥 Found ${orgAdmins.length} owners/admins for ${org.name}`);
        
        // Get emails from organization_members
        let adminEmails = [];
        for (const admin of orgAdmins) {
          if (admin.email) {
            adminEmails.push(admin.email);
            console.log(`   📧 Email from org_members: ${admin.email} (${admin.role})`);
          }
        }

        const alert = {
          organizationId: queuedAlert.organization_id,
          organizationName: org.name,
          currentCredits: queuedAlert.current_credits,
          threshold: queuedAlert.threshold,
          timestamp: queuedAlert.created_at,
          alertType: 'low_credits_warning',
          source: 'real_time_consumption',
          organizationEmails: adminEmails,
          ownersAndAdminsCount: orgAdmins.length,
          hasEmailIssues: adminEmails.length === 0 && orgAdmins.length > 0,
          adminUserIds: orgAdmins.map(a => ({ userId: a.user_id, role: a.role, hasEmail: !!a.email }))
        };
        
        lowCreditAlerts.push(alert);
        console.log(`   ✅ Queued alert added for ${org.name}`);

        // Mark as processed
        await supabaseService
          .from('low_credit_alert_queue')
          .update({ status: 'processed', processed_at: currentTime })
          .eq('id', queuedAlert.id);

      } catch (queueError) {
        console.error(`   ❌ Error processing queued alert ${queuedAlert.id}:`, queueError);
        // Mark as failed
        await supabaseService
          .from('low_credit_alert_queue')
          .update({ status: 'failed', processed_at: currentTime })
          .eq('id', queuedAlert.id);
      }
    }

    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`   - Organizations checked: ${organizations.length}`);
    console.log(`   - Low credit alerts found: ${lowCreditAlerts.length}`);

    // Step 9: Send webhook if alerts found
    if (lowCreditAlerts.length > 0) {
      console.log('\n📤 STEP 9: Sending webhook...');
      
      try {
        const webhookPayload = {
          alerts: lowCreditAlerts,
          totalAlertsCount: lowCreditAlerts.length,
          checkTimestamp: currentTime,
          source: 'automated_credit_monitoring_v4',
          systemInfo: {
            organizationsChecked: organizations.length,
            creditsRecordsFound: userCredits.length,
            settingsRecordsFound: billingSettings.length,
            membersRecordsFound: organizationMembers.length
          }
        };
        
        console.log('📋 Webhook payload:', JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch(
          'https://n8n.srv922768.hstgr.cloud/webhook/e109ee08-20c1-475f-89cb-aa8aa308081d',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          }
        );

        console.log(`📬 Webhook response status: ${webhookResponse.status}`);
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook sent successfully');
          const responseText = await webhookResponse.text();
          console.log('📥 Webhook response:', responseText);
        } else {
          const errorText = await webhookResponse.text();
          console.error('❌ Webhook failed:', errorText);
        }
        
      } catch (webhookError) {
        console.error('❌ Webhook error:', webhookError);
      }
    } else {
      console.log('\n💯 No alerts needed - all organizations have sufficient credits');
    }

    console.log('\n🎉 === LOW CREDITS CHECK COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Low credits check completed successfully',
        organizationsChecked: organizations.length,
        lowCreditAlertsFound: lowCreditAlerts.length,
        alerts: lowCreditAlerts,
        timestamp: currentTime,
        systemInfo: {
          creditsRecords: userCredits.length,
          settingsRecords: billingSettings.length,
          membersRecords: organizationMembers.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('\n💥 === CRITICAL FUNCTION ERROR ===');
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Function execution failed',
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});