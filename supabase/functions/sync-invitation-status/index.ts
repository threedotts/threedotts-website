import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting invitation status sync...')

    // Find invitations that should be marked as accepted
    // (members exist but invitations are still pending)
    const { data: pendingInvitations, error: invitationsError } = await supabaseClient
      .from('organization_invitations')
      .select('id, email, organization_id, created_at')
      .is('accepted_at', null)

    if (invitationsError) {
      console.error('Error fetching pending invitations:', invitationsError)
      throw invitationsError
    }

    console.log(`Found ${pendingInvitations?.length || 0} pending invitations`)

    let syncedCount = 0

    // Check each pending invitation against active members
    for (const invitation of pendingInvitations || []) {
      const { data: member, error: memberError } = await supabaseClient
        .from('organization_members')
        .select('joined_at')
        .eq('email', invitation.email)
        .eq('organization_id', invitation.organization_id)
        .eq('status', 'active')
        .maybeSingle()

      if (memberError) {
        console.error(`Error checking member for ${invitation.email}:`, memberError)
        continue
      }

      if (member) {
        console.log(`Found active member for invitation ${invitation.email}, marking as accepted`)
        
        // Mark invitation as accepted using the member's joined_at time
        const { error: updateError } = await supabaseClient
          .from('organization_invitations')
          .update({ 
            accepted_at: member.joined_at || new Date().toISOString()
          })
          .eq('id', invitation.id)

        if (updateError) {
          console.error(`Error updating invitation ${invitation.id}:`, updateError)
        } else {
          syncedCount++
          console.log(`Successfully synced invitation for ${invitation.email}`)
        }
      }
    }

    console.log(`Sync complete. Updated ${syncedCount} invitations.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${syncedCount} invitation(s)`,
        syncedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})