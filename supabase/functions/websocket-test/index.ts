import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== WebSocket Test Function Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";
  console.log('Upgrade header:', upgradeHeader);

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request');
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    console.log('✅ Upgrading to WebSocket...');
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = () => {
      console.log('✅ Test WebSocket connection opened');
      
      // Send a test message every 2 seconds
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          const testMessage = {
            type: 'test_message',
            timestamp: new Date().toISOString(),
            message: 'Hello from Supabase Edge Function WebSocket!'
          };
          console.log('📤 Sending test message:', testMessage);
          socket.send(JSON.stringify(testMessage));
        } else {
          console.log('❌ Socket not open, clearing interval');
          clearInterval(interval);
        }
      }, 2000);
      
      // Send immediate welcome message
      socket.send(JSON.stringify({
        type: 'welcome',
        message: 'WebSocket connection established successfully!'
      }));
    };

    socket.onmessage = (event) => {
      console.log('📨 Received from client:', event.data);
      
      // Echo the message back
      const response = {
        type: 'echo',
        original: JSON.parse(event.data),
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(response));
    };

    socket.onclose = (event) => {
      console.log('❌ Test WebSocket closed:', event.code, event.reason);
    };

    socket.onerror = (error) => {
      console.error('❌ Test WebSocket error:', error);
    };

    console.log('✅ WebSocket upgrade successful, returning response');
    return response;

  } catch (error) {
    console.error('❌ Error in WebSocket test setup:', error);
    return new Response(`WebSocket test error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});