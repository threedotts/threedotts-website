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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData: InvitationWebhookData = await req.json();
    
    console.log('Processando convite:', webhookData);

    // Por enquanto, vamos apenas simular o envio
    // TODO: Implementar envio de email via Gmail API
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

    // Simular sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite processado com sucesso (simulação)', 
        data: webhookData 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    
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