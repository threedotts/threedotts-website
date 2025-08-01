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

// Função para obter token de acesso do Google
async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    throw new Error('Google Service Account Key not found');
  }

  const credentials = JSON.parse(serviceAccountKey);
  
  const now = Math.floor(Date.now() / 1000);
  
  // Criar o payload do JWT
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id,
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Codificar header e payload
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Preparar dados para assinar
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  // Preparar a chave privada para importação
  const privateKeyPem = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const privateKeyDer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  // Importar a chave privada
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Assinar
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureData)
  );

  // Codificar assinatura
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

  // Trocar JWT por access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// Função para enviar email via Gmail API
async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlContent: string,
  fromEmail: string = 'noreply@threedotts.ai'
): Promise<any> {
  const emailContent = [
    `To: ${to}`,
    `From: ${fromEmail}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent,
  ].join('\n');

  const encodedMessage = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to send email: ${JSON.stringify(result)}`);
  }

  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData: InvitationWebhookData = await req.json();
    
    console.log('Enviando convite por email via Gmail API:', webhookData);

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

    // Obter token de acesso e enviar email
    const accessToken = await getGoogleAccessToken();
    const emailResponse = await sendGmailEmail(
      accessToken,
      webhookData.email,
      emailSubject,
      emailHtml
    );

    console.log('Email enviado com sucesso via Gmail API:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de convite enviado com sucesso via Gmail API', 
        messageId: emailResponse.id 
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
    console.error('Erro ao enviar email via Gmail API:', error);
    
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