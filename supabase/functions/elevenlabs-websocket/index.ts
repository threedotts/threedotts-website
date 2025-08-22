import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== ElevenLabs WebSocket Proxy Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";
  console.log('Upgrade header:', upgradeHeader);

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request, upgrade header:', upgradeHeader);
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');
    console.log('Agent ID from params:', agentId);
    
    if (!agentId) {
      console.log('Missing agent_id parameter');
      return new Response("Missing agent_id parameter", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not configured');
      return new Response("ElevenLabs API key not configured", { 
        status: 500,
        headers: corsHeaders 
      });
    }
    console.log('API Key configured (length):', elevenLabsApiKey.length);

    console.log('Upgrading WebSocket connection...');
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Add connection timeout
    let connectionTimeout: number;
    let elevenLabsWs: WebSocket | null = null;
    
    // Handle client connection
    socket.onopen = () => {
      console.log('Client WebSocket connected, initiating ElevenLabs connection...');
      
      // Clear any existing timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        console.log('Connection timeout, closing sockets');
        if (elevenLabsWs) elevenLabsWs.close();
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1008, 'Connection timeout');
        }
      }, 10000); // 10 second timeout
      
      try {
        const elevenLabsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        console.log('Connecting to ElevenLabs:', elevenLabsUrl);
        
        elevenLabsWs = new WebSocket(elevenLabsUrl);
        
        elevenLabsWs.onopen = () => {
          console.log('✅ ElevenLabs WebSocket connected successfully');
          clearTimeout(connectionTimeout);
          
          // Send initial message with API key
          const initMessage = {
            type: 'conversation_initiation_client_data',
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: "You are a helpful AI assistant."
                }
              }
            }
          };
          
          console.log('Sending init message:', JSON.stringify(initMessage));
          elevenLabsWs.send(JSON.stringify(initMessage));
          
          // Notify client that connection is ready
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'connection_ready',
              message: 'Connected to ElevenLabs successfully'
            }));
          }
        };

        elevenLabsWs.onmessage = (event) => {
          console.log('📨 Message from ElevenLabs:', typeof event.data, event.data.substring(0, 100) + '...');
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        elevenLabsWs.onclose = (event) => {
          console.log('❌ ElevenLabs WebSocket closed:', event.code, event.reason);
          if (socket.readyState === WebSocket.OPEN) {
            socket.close(event.code, event.reason);
          }
        };

        elevenLabsWs.onerror = (error) => {
          console.error('❌ ElevenLabs WebSocket error:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.close(1011, 'ElevenLabs connection error');
          }
        };
        
      } catch (error) {
        console.error('Error creating ElevenLabs WebSocket:', error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1011, 'Failed to connect to ElevenLabs');
        }
      }
    };

    socket.onmessage = (event) => {
      console.log('📤 Message from client:', typeof event.data, event.data.substring(0, 100) + '...');
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(event.data);
      } else {
        console.log('ElevenLabs WebSocket not ready, state:', elevenLabsWs?.readyState);
      }
    };

    socket.onclose = (event) => {
      console.log('Client WebSocket closed:', event.code, event.reason);
      clearTimeout(connectionTimeout);
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      clearTimeout(connectionTimeout);
    };

    return response;

  } catch (error) {
    console.error('❌ Error in WebSocket proxy setup:', error);
    return new Response(`WebSocket proxy error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});