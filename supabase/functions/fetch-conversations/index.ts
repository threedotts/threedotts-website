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
    const { agentIds, callStartAfterUnix } = await req.json()

    if (!agentIds || !Array.isArray(agentIds)) {
      return new Response(
        JSON.stringify({ error: 'agentIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter out empty, null, or invalid agent IDs
    const validAgentIds = agentIds.filter(id => 
      id && typeof id === 'string' && id.trim() !== ''
    )

    console.log('Original agentIds:', agentIds)
    console.log('Valid agentIds after filtering:', validAgentIds)

    // If no valid agent IDs, return empty results
    if (validAgentIds.length === 0) {
      console.log('No valid agent IDs provided, returning empty results')
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching conversations for valid agents:', validAgentIds)

    // Fetch conversations for each valid agent with pagination
    const conversationPromises = validAgentIds.map(async (agentId: string) => {
      try {
        let allConversations: any[] = []
        let cursor = ''
        let hasMore = true

        while (hasMore) {
          const url = new URL('https://api.elevenlabs.io/v1/convai/conversations')
          url.searchParams.append('agent_id', agentId)
          url.searchParams.append('page_size', '100')
          url.searchParams.append('summary_mode', 'exclude')
          url.searchParams.append('call_start_before_unix', '0')
          url.searchParams.append('call_start_after_unix', callStartAfterUnix?.toString() || '0')
          
          if (cursor) {
            url.searchParams.append('cursor', cursor)
          }

          console.log(`[${agentId}] API Call - Using cursor: "${cursor || 'EMPTY'}"`)
          console.log(`[${agentId}] Full API URL: ${url.toString()}`)

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
          
          console.log(`[${agentId}] API Response:`)
          console.log(`  - conversations_count: ${data.conversations?.length || 0}`)
          console.log(`  - has_more: ${data.has_more}`)
          console.log(`  - next_cursor: "${data.next_cursor || 'NULL'}"`)

          // Add conversations from this page
          if (data.conversations && Array.isArray(data.conversations)) {
            allConversations = allConversations.concat(data.conversations)
          }

          // Update pagination variables BEFORE checking conditions
          const previousHasMore = hasMore
          hasMore = data.has_more === true
          
          console.log(`[${agentId}] Pagination Status:`)
          console.log(`  - previous hasMore: ${previousHasMore}`)
          console.log(`  - new hasMore: ${hasMore}`)
          
          if (hasMore) {
            const previousCursor = cursor
            cursor = data.next_cursor || ''
            console.log(`  - cursor updated from "${previousCursor || 'EMPTY'}" to "${cursor || 'EMPTY'}"`)
            
            if (!cursor) {
              console.warn(`[${agentId}] PAGINATION ERROR: has_more is true but no next_cursor provided, stopping pagination`)
              hasMore = false
            }
          } else {
            console.log(`[${agentId}] Pagination complete - no more pages`)
          }
        }

        console.log(`Total conversations fetched for agent ${agentId}: ${allConversations.length}`)
        
        // Count done conversations by agent name
        const doneByAgent: { [agentName: string]: number } = {}
        
        allConversations.forEach(conversation => {
          if (conversation.status === 'done') {
            const agentName = conversation.agent_name || 'Unknown Agent'
            doneByAgent[agentName] = (doneByAgent[agentName] || 0) + 1
          }
        })
        
        // Log the done counts
        Object.entries(doneByAgent).forEach(([agentName, count]) => {
          console.log(`${agentName}: ${count}`)
        })
        
        if (Object.keys(doneByAgent).length === 0) {
          console.log(`No done conversations found for agent ${agentId}`)
        }
        
        return { 
          agentId, 
          data: { 
            conversations: allConversations,
            total_count: allConversations.length
          } 
        }
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