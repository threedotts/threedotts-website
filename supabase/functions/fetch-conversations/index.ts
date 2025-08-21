import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { agentIds } = await req.json()

    if (!agentIds || !Array.isArray(agentIds)) {
      return new Response(
        JSON.stringify({ error: 'agentIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching conversations for agents:', agentIds)

    // Fetch conversations for each agent
    const conversationPromises = agentIds.map(async (agentId: string) => {
      try {
        const url = new URL('https://api.elevenlabs.io/v1/convai/conversations')
        url.searchParams.append('agent_id', agentId)
        url.searchParams.append('page_size', '100')
        url.searchParams.append('summary_mode', 'exclude')
        url.searchParams.append('call_start_before_unix', '0')
        url.searchParams.append('call_start_after_unix', '0')

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Error fetching conversations for agent ${agentId}:`, response.status, await response.text())
          return { agentId, error: `HTTP ${response.status}` }
        }

        const data = await response.json()
        console.log(`Conversations for agent ${agentId}:`, data)
        
        return { agentId, data }
      } catch (error) {
        console.error(`Error fetching conversations for agent ${agentId}:`, error)
        return { agentId, error: error.message }
      }
    })

    const results = await Promise.all(conversationPromises)
    
    return new Response(
      JSON.stringify({ results }),
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