import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mark users as offline if they haven't been seen in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: inactiveUsers, error: selectError } = await supabase
      .from('user_presence')
      .select('*')
      .eq('is_online', true)
      .lt('last_seen_at', twoMinutesAgo);

    if (selectError) {
      console.error('Error selecting inactive users:', selectError);
      throw selectError;
    }

    console.log(`Found ${inactiveUsers?.length || 0} inactive users to mark as offline`);

    if (inactiveUsers && inactiveUsers.length > 0) {
      const { error: updateError } = await supabase
        .from('user_presence')
        .update({ 
          is_online: false,
          last_seen_at: new Date().toISOString()
        })
        .eq('is_online', true)
        .lt('last_seen_at', twoMinutesAgo);

      if (updateError) {
        console.error('Error updating inactive users:', updateError);
        throw updateError;
      }

      console.log(`Successfully marked ${inactiveUsers.length} users as offline`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        markedOffline: inactiveUsers?.length || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cleanup-inactive-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});