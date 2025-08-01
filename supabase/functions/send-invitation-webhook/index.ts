import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationWebhookData {
  email: string;
  role: string;
  organization_name: string;
  organization_id: string;
  invited_by_email: string;
  invited_by_id: string;
  invitation_date: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData: InvitationWebhookData = await req.json();
    
    console.log('Enviando dados para webhook n8n:', webhookData);

    // Fazer a chamada para o webhook n8n
    const response = await fetch('https://n8n.srv922768.hstgr.cloud/webhook-test/7794737f-fb88-4f53-8903-5cc6db3a98c2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    console.log('Resposta do webhook n8n:', response.status);

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook enviado com sucesso' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao enviar webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);