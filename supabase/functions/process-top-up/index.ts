import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopUpRequest {
  amount: number;
  paymentMethod: 'mpesa' | 'bank_transfer';
  phoneNumber?: string;
  accountDetails?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's organization (admin/owner only)
    const { data: membership, error: memberError } = await supabaseClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Only organization owners and admins can top up credits.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, paymentMethod, phoneNumber, accountDetails }: TopUpRequest = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate cost (example: 1 KES per credit)
    const costPerCredit = 1.0;
    const totalCost = amount * costPerCredit;

    // Generate a unique payment reference
    const paymentReference = `TOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending billing history record
    const { data: billingRecord, error: billingError } = await supabaseService
      .from('billing_history')
      .insert({
        organization_id: membership.organization_id,
        type: 'top_up',
        amount: amount,
        cost: totalCost,
        currency: 'KES',
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        description: `Credit top-up - ${amount} credits via ${paymentMethod}`,
        status: 'pending',
        metadata: {
          phone_number: phoneNumber,
          account_details: accountDetails,
          initiated_by: user.id,
          initiated_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (billingError) {
      console.error('Error creating billing record:', billingError);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate top-up' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Here you would integrate with actual payment providers
    // For now, we'll simulate the payment process

    let paymentInstructions = '';
    let nextSteps = '';

    if (paymentMethod === 'mpesa') {
      paymentInstructions = `
        Para completar o pagamento via M-Pesa:
        1. Vá para o menu de M-Pesa no seu telefone
        2. Selecione "Lipa na M-Pesa"
        3. Selecione "Paybill"
        4. Digite o Business Number: 123456
        5. Digite o Account Number: ${paymentReference}
        6. Digite o valor: KES ${totalCost}
        7. Digite o seu M-Pesa PIN e confirme
      `;
      nextSteps = 'Seus créditos serão adicionados automaticamente após a confirmação do pagamento.';
    } else if (paymentMethod === 'bank_transfer') {
      paymentInstructions = `
        Para completar o pagamento via transferência bancária:
        
        Dados Bancários:
        Banco: Equity Bank
        Número da Conta: 1234567890
        Nome: Threedotts Ltd
        Referência: ${paymentReference}
        Valor: KES ${totalCost}
        
        Por favor, use a referência: ${paymentReference} na sua transferência.
      `;
      nextSteps = 'Envie o comprovante de transferência para billing@threedotts.com com a referência para processamento rápido.';
    }

    // In a real implementation, you would:
    // 1. Integrate with M-Pesa API for mobile payments
    // 2. Set up webhook to receive payment confirmations
    // 3. Update billing status and add credits automatically

    return new Response(
      JSON.stringify({
        success: true,
        paymentReference,
        amount,
        totalCost,
        currency: 'KES',
        paymentMethod,
        paymentInstructions,
        nextSteps,
        billingRecordId: billingRecord.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in process-top-up function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});