import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    const { userIds } = await req.json()

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching emails for user IDs:', userIds)

    // Get emails from auth.users for the provided user IDs
    const { data: users, error } = await supabaseClient.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    // Create a map of user_id -> email
    const emailMap: Record<string, string> = {}
    
    users.users.forEach(user => {
      if (userIds.includes(user.id) && user.email) {
        emailMap[user.id] = user.email
      }
    })

    console.log('Email map created:', emailMap)

    return new Response(
      JSON.stringify({ emailMap }),
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