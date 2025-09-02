import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    
    // Send data to n8n webhook
    const webhookResponse = await fetch(
      'https://n8n.srv922768.hstgr.cloud/webhook-test/ef343510-6dc3-4b6a-b1fa-6b4c26b2c5cb',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestData,
          timestamp: new Date().toISOString(),
          source: 'newsletter_signup'
        })
      }
    )

    if (!webhookResponse.ok) {
      throw new Error(`Webhook responded with status: ${webhookResponse.status}`)
    }

    const result = await webhookResponse.text()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email subscrito com sucesso',
        webhookResult: result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro ao enviar para webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Falha ao subscrever email',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})