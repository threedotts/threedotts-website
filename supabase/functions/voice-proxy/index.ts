import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    // Extract organizationId from URL params
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');
    
    if (!organizationId) {
      return new Response("Organization ID required", { status: 400 });
    }

    console.log('🎯 Voice proxy requested for organization:', organizationId);

    // Get organization config
    const { data: config, error } = await supabase
      .from('organization_agent_config')
      .select('primary_agent_id, api_key_secret_name')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error || !config) {
      console.error('❌ No config found for organization:', organizationId);
      return new Response("Organization config not found", { status: 404 });
    }

    // Get API key
    let voiceApiKey = Deno.env.get(config.api_key_secret_name);
    if (!voiceApiKey) {
      try {
        const { data: secretData } = await supabase
          .rpc('vault.read_secret', { secret_name: config.api_key_secret_name });
        voiceApiKey = secretData;
      } catch (error) {
        console.error('❌ Could not retrieve API key:', error);
        return new Response("API key not configured", { status: 500 });
      }
    }

    if (!voiceApiKey) {
      return new Response("API key not found", { status: 500 });
    }

    console.log('✅ Proxying connection for agent:', config.primary_agent_id);

    // Upgrade client connection to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to ElevenLabs
    const elevenLabsUrl = `wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=${config.primary_agent_id}`;
    const elevenLabsSocket = new WebSocket(elevenLabsUrl);

    // Forward messages from client to ElevenLabs
    socket.onmessage = (event) => {
      console.log('📤 Client -> Voice API:', JSON.parse(event.data).type || 'audio_chunk');
      if (elevenLabsSocket.readyState === WebSocket.OPEN) {
        elevenLabsSocket.send(event.data);
      }
    };

    // Forward messages from ElevenLabs to client
    elevenLabsSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📥 Voice API -> Client:', message.type || 'unknown');
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    // Handle ElevenLabs connection events
    elevenLabsSocket.onopen = () => {
      console.log('✅ Connected to Voice API');
    };

    elevenLabsSocket.onclose = (event) => {
      console.log('❌ Voice API disconnected:', event.code, event.reason);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    elevenLabsSocket.onerror = (error) => {
      console.error('❌ Voice API error:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    // Handle client connection events
    socket.onopen = () => {
      console.log('✅ Client connected to proxy');
    };

    socket.onclose = (event) => {
      console.log('❌ Client disconnected:', event.code, event.reason);
      if (elevenLabsSocket.readyState === WebSocket.OPEN) {
        elevenLabsSocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error('❌ Client error:', error);
      if (elevenLabsSocket.readyState === WebSocket.OPEN) {
        elevenLabsSocket.close();
      }
    };

    // Connection timeout after 10 seconds
    setTimeout(() => {
      if (elevenLabsSocket.readyState === WebSocket.CONNECTING) {
        console.log('⏰ Connection timeout');
        elevenLabsSocket.close();
        socket.close();
      }
    }, 10000);

    return response;

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response("Internal server error", { status: 500 });
  }
});