import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function called with method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";
  console.log('Upgrade header:', upgradeHeader);

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request');
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');
    console.log('Agent ID from URL:', agentId);
    
    if (!agentId) {
      console.log('Missing agent_id parameter');
      return new Response("Missing agent_id parameter", { status: 400 });
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not found in environment');
      return new Response("ElevenLabs API key not configured", { status: 500 });
    }
    console.log('ElevenLabs API key found:', elevenLabsApiKey.substring(0, 10) + '...');

    console.log('Setting up WebSocket proxy for agent:', agentId);

    const { socket, response } = Deno.upgradeWebSocket(req);
    console.log('WebSocket upgrade successful');
    
    // Connect to ElevenLabs WebSocket
    console.log('Attempting to connect to ElevenLabs WebSocket...');
    const elevenLabsWsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    console.log('ElevenLabs WebSocket URL:', elevenLabsWsUrl);
    
    const elevenLabsWs = new WebSocket(elevenLabsWsUrl, [], {
      headers: {
        'xi-api-key': elevenLabsApiKey
      }
    });
    console.log('ElevenLabs WebSocket created');
    
    // Handle connection to ElevenLabs
    elevenLabsWs.onopen = () => {
      console.log('Connected to ElevenLabs WebSocket');
      
      // Send authentication
      elevenLabsWs.send(JSON.stringify({
        type: 'conversation_initiation_client_data',
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: "You are a helpful AI assistant. Respond naturally and helpfully to user questions."
            }
          }
        }
      }));
    };

    elevenLabsWs.onmessage = (event) => {
      console.log('Message from ElevenLabs:', event.data);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    elevenLabsWs.onclose = (event) => {
      console.log('ElevenLabs WebSocket closed:', event.code, event.reason);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(event.code, event.reason);
      }
    };

    elevenLabsWs.onerror = (error) => {
      console.error('ElevenLabs WebSocket error:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1011, 'ElevenLabs connection error');
      }
    };

    // Handle messages from client
    socket.onopen = () => {
      console.log('Client WebSocket connected');
    };

    socket.onmessage = (event) => {
      console.log('Message from client:', event.data);
      if (elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(event.data);
      }
    };

    socket.onclose = (event) => {
      console.log('Client WebSocket closed:', event.code, event.reason);
      if (elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      if (elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    };

    return response;

  } catch (error) {
    console.error('Error setting up WebSocket proxy:', error);
    return new Response(`WebSocket proxy error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});