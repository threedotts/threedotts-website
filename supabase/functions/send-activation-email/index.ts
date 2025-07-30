import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivationEmailRequest {
  email: string;
  name: string;
  organizationName: string;
  activationCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, organizationName, activationCode }: ActivationEmailRequest = await req.json();

    console.log("Sending activation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Call Center <onboarding@resend.dev>",
      to: [email],
      subject: `Código de Ativação - ${organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Ativação do Call Center</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
            .activation-code { background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px; font-family: monospace; }
            .steps { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 15px 0; padding-left: 20px; position: relative; }
            .step::before { content: counter(step-counter); counter-increment: step-counter; position: absolute; left: 0; background: #007bff; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
            .steps ol { counter-reset: step-counter; list-style: none; padding: 0; }
            .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Organização Criada com Sucesso!</h1>
            <p>Bem-vindo ao seu novo Call Center</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Parabéns! Sua organização "<strong>${organizationName}</strong>" foi criada com sucesso.</p>
            
            <div class="activation-code">
              <h3>Seu Código de Ativação:</h3>
              <div class="code">${activationCode}</div>
              <p><em>Guarde este código com segurança - você precisará dele para ativar seu call center!</em></p>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Este código é único e necessário para ativar todas as funcionalidades do seu call center no dashboard.
            </div>

            <div class="steps">
              <h3>Como Ativar seu Call Center:</h3>
              <ol>
                <li class="step">
                  <strong>Acesse o Dashboard:</strong> Faça login na plataforma e vá para o dashboard da sua organização.
                </li>
                <li class="step">
                  <strong>Localize a Seção de Ativação:</strong> Procure pela opção "Ativar Call Center" ou "Configurações".
                </li>
                <li class="step">
                  <strong>Insira o Código:</strong> Digite o código de ativação <code>${activationCode}</code> no campo correspondente.
                </li>
                <li class="step">
                  <strong>Configure seus Agentes:</strong> Após a ativação, você poderá configurar agentes virtuais, números de telefone e integrações.
                </li>
                <li class="step">
                  <strong>Teste o Sistema:</strong> Realize chamadas de teste para garantir que tudo está funcionando corretamente.
                </li>
              </ol>
            </div>

            <h3>Próximos Passos:</h3>
            <ul>
              <li>Configure os números de telefone para seu call center</li>
              <li>Personalize as mensagens e fluxos de atendimento</li>
              <li>Integre com seus sistemas existentes (CRM, ERP, etc.)</li>
              <li>Treine sua equipe no uso da plataforma</li>
            </ul>

            <h3>Suporte:</h3>
            <p>Se você tiver alguma dúvida ou precisar de ajuda durante o processo de ativação, entre em contato com nosso suporte técnico.</p>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente. Por favor, não responda.</p>
            <p><strong>Equipe Call Center Platform</strong></p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-activation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);