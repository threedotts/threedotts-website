import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== ElevenLabs Multi-Context WebSocket Proxy Started ===');
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
    const voiceId = url.searchParams.get('voice_id');
    const modelId = url.searchParams.get('model_id') || 'eleven_flash_v2_5';
    console.log('Voice ID from params:', voiceId);
    console.log('Model ID from params:', modelId);
    
    if (!voiceId) {
      console.log('Missing voice_id parameter');
      return new Response("Missing voice_id parameter", { 
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
    
    // Keep-alive system
    let keepAliveInterval: number;
    let elevenLabsWs: WebSocket | null = null;
    let lastActivity = Date.now();
    
    // Handle client connection
    socket.onopen = () => {
      console.log('Client WebSocket connected, initiating ElevenLabs multi-context connection...');
      lastActivity = Date.now();
      
      // Start keep-alive system
      keepAliveInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          console.log('🏓 Sending keep-alive ping');
        }
      }, 30000); // Send ping every 30 seconds
      
      try {
        const elevenLabsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/multi-stream-input?model_id=${modelId}`;
        console.log('Connecting to ElevenLabs Multi-Context API:', elevenLabsUrl);
        
        // Create WebSocket without custom headers (not supported properly)
        elevenLabsWs = new WebSocket(elevenLabsUrl);
        
        elevenLabsWs.onopen = () => {
          console.log('✅ ElevenLabs Multi-Context WebSocket connected successfully');
          lastActivity = Date.now();
          
          // Notify client that connection is ready
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'connection_ready', 
              message: 'Connected to ElevenLabs Multi-Context API successfully'
            }));
          }
        };

        elevenLabsWs.onmessage = (event) => {
          console.log('📨 Message from ElevenLabs:', typeof event.data);
          let data;
          try {
            data = JSON.parse(event.data);
            console.log('📨 Parsed message from ElevenLabs:', {
              hasAudio: !!data.audio,
              contextId: data.contextId,
              isFinal: data.isFinal,
              error: data.error,
              messageType: data.type || 'unknown'
            });
            
            // Log additional details if there's an error or no audio
            if (data.error) {
              console.error('❌ ElevenLabs API Error:', data.error, data.message || '');
            }
            
            if (!data.audio && data.isFinal) {
              console.warn('⚠️ Received final message but no audio data');
            }
            
          } catch (e) {
            console.log('📨 Raw message from ElevenLabs (length):', event.data.length);
            data = event.data;
          }
          
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
      lastActivity = Date.now();
      
      let clientData;
      try {
        clientData = JSON.parse(event.data);
        
        // Handle ping/pong messages for keep-alive
        if (clientData.type === 'ping') {
          console.log('🏓 Received ping from client, sending pong');
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }
        
        // Don't log user_audio_chunk messages to reduce console noise
        if (clientData.type !== 'user_audio_chunk') {
          console.log('📤 Client message details:', {
            type: clientData.type,
            hasText: !!clientData.text,
            contextId: clientData.context_id,
            hasVoiceSettings: !!clientData.voice_settings,
            textLength: clientData.text ? clientData.text.length : 0
          });
        }
        
      } catch (e) {
        console.log('📤 Raw client message length:', event.data.length);
      }
      
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN && clientData && clientData.type !== 'ping') {
        // Send the message with API key included
        const messageWithAuth = {
          ...clientData,
          xi_api_key: elevenLabsApiKey
        };
        elevenLabsWs.send(JSON.stringify(messageWithAuth));
        
        if (clientData.type !== 'user_audio_chunk') {
          console.log('✅ Message forwarded to ElevenLabs');
        }
      } else if (clientData && clientData.type !== 'ping' && clientData.type !== 'pong') {
        console.log('❌ ElevenLabs WebSocket not ready, state:', elevenLabsWs?.readyState);
      }
    };

    socket.onclose = (event) => {
      console.log('Client WebSocket closed:', event.code, event.reason);
      clearInterval(keepAliveInterval);
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      clearInterval(keepAliveInterval);
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