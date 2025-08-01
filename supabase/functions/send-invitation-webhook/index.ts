import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    
    console.log('Enviando convite por email:', webhookData);

    // Criar o email usando o template fornecido
    const emailSubject = `Convite para ${webhookData.organization_name}`;
    const emailHtml = `
      <p>Olá,</p>
      
      <p>Convite para o acesso ao nosso Dashboard do Call Center com a seguinte função:</p>
      
      <p>📍 <strong>Cargo:</strong> ${webhookData.role}</p>
      
      <p>Para ativar o acesso, basta clicar no link abaixo e concluir o cadastro utilizando exatamente o e-mail em que esta mensagem foi recebida (${webhookData.email}):</p>
      
      <p>👉 <a href="${webhookData.invitation_link}" style="color: #2563eb; text-decoration: underline;">${webhookData.invitation_link}</a></p>
      
      <p><strong>Bem-vindo(a) ao Threedotts Platform!</strong></p>
      
      <p>Atenciosamente,<br>
      ${webhookData.invited_by_name}<br>
      ${webhookData.organization_name}</p>
    `;

    // Enviar email usando Resend
    const emailResponse = await resend.emails.send({
      from: 'Threedotts Platform <onboarding@resend.dev>',
      to: [webhookData.email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log('Email enviado com sucesso:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de convite enviado com sucesso', emailId: emailResponse.data?.id }),
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