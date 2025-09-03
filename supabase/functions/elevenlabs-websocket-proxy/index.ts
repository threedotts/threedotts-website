import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('=== ElevenLabs WebSocket Proxy with Credit Control ===');
  
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');
    const agentId = url.searchParams.get('agent_id');

    if (!organizationId || !agentId) {
      return new Response("Missing organization_id or agent_id", { 
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('WebSocket connection request for org:', organizationId, 'agent:', agentId);

    // LAYER 2: Initial credit check
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('current_credits')
      .eq('organization_id', organizationId)
      .single();

    if (creditError || !creditData || creditData.current_credits <= 0) {
      console.log('WebSocket denied - insufficient credits:', creditData?.current_credits || 0);
      return new Response("Insufficient credits for conversation", { 
        status: 402,
        headers: corsHeaders
      });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to ElevenLabs
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const elevenLabsWs = new WebSocket(
      `wss://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": elevenLabsApiKey } }
    );

    let isAlive = true;
    let heartbeatInterval: number;
    let creditsReserved = false;

    // LAYER 5: Reserve credits at start
    const reserveCredits = async () => {
      const reserveAmount = 100; // Reserve 100 credits for conversation
      console.log('Reserving credits:', reserveAmount);
      
      const { error } = await supabase.rpc('consume_credits', {
        org_id: organizationId,
        credits_to_consume: reserveAmount
      });

      if (error) {
        console.error('Failed to reserve credits:', error);
        clientSocket.close(1008, 'Unable to reserve credits');
        elevenLabsWs.close();
        return false;
      }

      creditsReserved = true;
      return true;
    };

    // LAYER 2: Continuous credit monitoring
    const checkCredits = async () => {
      if (!isAlive) return;

      const { data: currentCredits, error } = await supabase
        .from('user_credits')
        .select('current_credits')
        .eq('organization_id', organizationId)
        .single();

      if (error || !currentCredits || currentCredits.current_credits <= 0) {
        console.log('Credits depleted during conversation. Terminating...');
        isAlive = false;
        
        // Send graceful termination message
        clientSocket.send(JSON.stringify({
          type: 'credit_depleted',
          message: 'Your credits have been depleted. The conversation will now end.',
          current_credits: currentCredits?.current_credits || 0
        }));

        setTimeout(() => {
          clientSocket.close(1008, 'Credits depleted');
          elevenLabsWs.close();
        }, 2000); // Give 2 seconds for message to be processed
      }
    };

    clientSocket.onopen = async () => {
      console.log('Client WebSocket connected');
      
      // Reserve credits first
      const reserved = await reserveCredits();
      if (!reserved) return;

      // Start heartbeat for credit monitoring (every 30 seconds)
      heartbeatInterval = setInterval(checkCredits, 30000);
    };

    clientSocket.onmessage = (event) => {
      if (isAlive && elevenLabsWs.readyState === WebSocket.OPEN) {
        const message = JSON.parse(event.data);
        
        // Add organization_id to all outgoing messages for tracking
        message.organization_id = organizationId;
        
        elevenLabsWs.send(JSON.stringify(message));
      }
    };

    clientSocket.onclose = () => {
      console.log('Client WebSocket disconnected');
      isAlive = false;
      clearInterval(heartbeatInterval);
      elevenLabsWs.close();
    };

    elevenLabsWs.onopen = () => {
      console.log('Connected to ElevenLabs');
    };

    elevenLabsWs.onmessage = (event) => {
      if (isAlive && clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
    };

    elevenLabsWs.onclose = () => {
      console.log('ElevenLabs WebSocket disconnected');
      if (isAlive) {
        clientSocket.close();
      }
    };

    elevenLabsWs.onerror = (error) => {
      console.error('ElevenLabs WebSocket error:', error);
      clientSocket.close(1011, 'Upstream connection error');
    };

    return response;

  } catch (error) {
    console.error('WebSocket proxy error:', error);
    return new Response(`WebSocket proxy error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders
    });
  }
});