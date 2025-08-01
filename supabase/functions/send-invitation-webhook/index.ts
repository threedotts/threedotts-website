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
  invited_by_name: string;
  invitation_date: string;
  invitation_token: string;
  invitation_link: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Edge Function iniciada:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processando request POST');
    
    const webhookData: InvitationWebhookData = await req.json();
    console.log('Dados recebidos:', JSON.stringify(webhookData, null, 2));

    // Simular processamento do convite
    console.log('Simulando envio de email para:', webhookData.email);
    console.log('Template do email:');
    console.log(`
      Olá,
      
      Convite para o acesso ao nosso Dashboard do Call Center com a seguinte função:
      
      📍 Cargo: ${webhookData.role}
      
      Para ativar o acesso, basta clicar no link abaixo e concluir o cadastro utilizando exatamente o e-mail em que esta mensagem foi recebida (${webhookData.email}):
      
      👉 ${webhookData.invitation_link}
      
      Bem-vindo(a) ao Threedotts Platform!
      
      Atenciosamente,
      ${webhookData.invited_by_name}
      ${webhookData.organization_name}
    `);

    console.log('Preparando resposta de sucesso');

    const response = {
      success: true,
      message: 'Convite processado com sucesso (simulação)',
      data: {
        email: webhookData.email,
        role: webhookData.role,
        organization: webhookData.organization_name,
        invitation_link: webhookData.invitation_link
      }
    };

    console.log('Enviando resposta:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Erro capturado na Edge Function:', error);
    console.error('Stack trace:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Erro desconhecido',
      stack: error.stack
    };

    console.log('Enviando resposta de erro:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(
      JSON.stringify(errorResponse),
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

console.log('Edge Function carregada, iniciando servidor...');
serve(handler);