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
      'https://n8n.srv922768.hstgr.cloud/webhook/1e4a11ee-8ae7-4654-beaa-e823e3531871',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestData,
          timestamp: new Date().toISOString(),
          source: 'project_request_form'
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
        message: 'Dados enviados com sucesso para o webhook',
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
        error: 'Falha ao enviar dados para o webhook',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})