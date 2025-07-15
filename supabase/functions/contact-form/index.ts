import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Max 5 requests per 15 minutes
  
  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxRequests) {
    return true;
  }
  
  current.count++;
  return false;
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Tente novamente em 15 minutos.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const formData = await req.json();
    console.log('Contact form submission received');

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'company', 'message'];
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        return new Response(
          JSON.stringify({ 
            error: `Campo obrigatório: ${field}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      company: sanitizeInput(formData.company),
      message: sanitizeInput(formData.message),
    };

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for spam patterns
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'urgent', 'click here'];
    const messageContent = sanitizedData.message.toLowerCase();
    const hasSpam = spamKeywords.some(keyword => messageContent.includes(keyword));
    
    if (hasSpam) {
      console.log('Spam detected in message:', sanitizedData.email);
      return new Response(
        JSON.stringify({ error: 'Mensagem rejeitada por nosso filtro de spam' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the contact form submission (in production, save to database or send email)
    console.log('Valid contact form submission:', {
      email: sanitizedData.email,
      company: sanitizedData.company,
      timestamp: new Date().toISOString(),
      ip: clientIP
    });

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with CRM system
    
    return new Response(
      JSON.stringify({ 
        message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing contact form:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor. Tente novamente mais tarde.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});