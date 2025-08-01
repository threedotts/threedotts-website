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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to resend confirmation email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Attempting to resend confirmation for email:', email)

    // First, try to delete any unconfirmed user with this email
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const unconfirmedUser = existingUsers.users.find(user => 
        user.email === email && !user.email_confirmed_at
      )
      
      if (unconfirmedUser) {
        console.log('Found unconfirmed user, deleting:', unconfirmedUser.id)
        await supabaseAdmin.auth.admin.deleteUser(unconfirmedUser.id)
        console.log('Deleted unconfirmed user successfully')
      }
    } catch (deleteError) {
      console.error('Error deleting unconfirmed user:', deleteError)
    }

    // Now try to resend confirmation email using resend method
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${req.headers.get('origin') || 'https://d641cc7c-1eb2-4b38-9c11-73630dae5f26.lovableproject.com'}/`,
      }
    })

    if (error) {
      console.error('Error resending confirmation:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Confirmation email resent to: ${email}`)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmação reenviado com sucesso' 
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