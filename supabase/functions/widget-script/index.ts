import { corsHeaders } from '../_shared/cors.ts'

const serve = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const widgetScript = `
(function() {
  'use strict';
  
  // Configuration
  const config = {
    wsApiUrl: 'wss://api.elevenlabs.io/v1/convai/conversation',
    agentId: null // Will be set from URL params or config
  };

  // Widget state
  const state = {
    isConnected: false,
    isMuted: false,
    websocket: null,
    audioContext: null,
    audioWorklet: null
  };

  // Inject CSS styles
  function injectStyles() {
    const styles = \`
      #threedotts-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .threedotts-container {
        background: hsl(0 0% 100% / 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid hsl(175 30% 91% / 0.1);
        box-shadow: 0 8px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 9999px;
        padding: 8px 16px 8px 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .threedotts-container.connected {
        border-color: hsl(175 85% 35% / 0.3);
        box-shadow: 0 8px 25px -5px hsl(175 85% 35% / 0.2), 0 8px 10px -6px hsl(0 0% 0% / 0.1);
      }
      
      .threedotts-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(175 30% 96%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .threedotts-avatar-inner {
        width: 100%;
        height: 100%;
        background: hsl(170 20% 50% / 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .threedotts-avatar svg {
        width: 24px;
        height: 24px;
        color: hsl(170 20% 50%);
      }
      
      .threedotts-button {
        background: linear-gradient(135deg, hsl(175 85% 35%), hsl(165 90% 40%));
        color: hsl(0 0% 100%);
        border: none;
        padding: 8px 16px;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      
      .threedotts-button:hover {
        opacity: 0.9;
      }
      
      .threedotts-button.secondary {
        background: hsl(175 30% 96%);
        color: hsl(160 100% 8%);
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
      }
      
      .threedotts-button.danger {
        background: hsl(0 84% 60%);
        color: hsl(0 0% 100%);
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
      }
      
      .threedotts-controls {
        display: flex;
        gap: 8px;
        animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .threedotts-powered {
        font-size: 10px;
        color: hsl(170 20% 50%);
        text-align: right;
        margin-top: 8px;
      }
      
      @keyframes scaleIn {
        0% {
          opacity: 0;
          transform: scale(0.8);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      /* Icons */
      .icon-phone {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      
      .icon-phone-off,
      .icon-mic,
      .icon-mic-off {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    \`;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'threedotts-widget';
    widget.innerHTML = \`
      <div class="threedotts-container" id="threedotts-container">
        <div class="threedotts-avatar">
          <div class="threedotts-avatar-inner">
            <svg class="icon-user" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        <div id="threedotts-buttons">
          <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
            <svg class="icon-phone" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Ligar
          </button>
        </div>
      </div>
      <p class="threedotts-powered">Powered by threedotts AI</p>
    \`;
    
    document.body.appendChild(widget);
  }

  // Update UI based on state
  function updateUI() {
    const buttonsContainer = document.getElementById('threedotts-buttons');
    const container = document.getElementById('threedotts-container');
    if (!buttonsContainer || !container) return;
    
    if (state.isConnected) {
      container.classList.add('connected');
      buttonsContainer.innerHTML = \`
        <div class="threedotts-controls">
          <button class="threedotts-button danger" onclick="window.threedottsWidget.disconnect()">
            <svg class="icon-phone-off" viewBox="0 0 24 24">
              <path d="m10.68 13.31-2.22-2.22a16 16 0 0 1-2.4-5.63A2 2 0 0 1 8.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L12.09 10.9a16 16 0 0 1-1.41 2.41z"/>
              <path d="m16.46 12-1.27-1.27a2 2 0 0 1-.45-2.11 12.84 12.84 0 0 0 .7-2.81A2 2 0 0 1 17.39 4h3a2 2 0 0 1 2 1.72 19.79 19.79 0 0 1-.98 4.49z"/>
              <line x1="2" x2="22" y1="2" y2="22"/>
            </svg>
          </button>
          <button class="threedotts-button \${state.isMuted ? 'danger' : 'secondary'}" onclick="window.threedottsWidget.toggleMute()">
            \${state.isMuted ? 
              '<svg class="icon-mic-off" viewBox="0 0 24 24"><line x1="2" x2="22" y1="2" y2="22"/><path d="m7 7-.78-.22a1.53 1.53 0 0 0-.12-.03A3 3 0 0 0 3 9v3a9 9 0 0 0 5.69 8.31A3 3 0 0 0 12 17v-6"/><path d="M9 9v4a3 3 0 0 0 5.12 2.12L9 9z"/><path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/></svg>' : 
              '<svg class="icon-mic" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>'
            }
          </button>
        </div>
      \`;
    } else {
      container.classList.remove('connected');
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
          <svg class="icon-phone" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Ligar
        </button>
      \`;
    }
  }

  // WebSocket connection
  async function connectWebSocket() {
    try {
      const agentId = config.agentId || new URLSearchParams(window.location.search).get('agentId');
      if (!agentId) {
        console.error('Agent ID is required');
        return;
      }

      console.log('Getting signed URL for agent:', agentId);
      
      // Get signed URL from Supabase Edge Function (same as working widget)
      const response = await fetch('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/get-elevenlabs-signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }) // Use agent_id not agentId
      });

      console.log('Fetch response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get signed URL:', response.status, errorText);
        throw new Error(\`Failed to get signed URL: \${response.status} - \${errorText}\`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      const signedUrl = data.signed_url; // Match the response structure
      console.log('Got signed URL, connecting to:', signedUrl);

      if (!signedUrl) {
        throw new Error('No signed URL received from edge function');
      }

      state.websocket = new WebSocket(signedUrl);
      
      state.websocket.onopen = () => {
        console.log('Connected to ThreeDotts AI via signed URL');
        state.isConnected = true;
        updateUI();
      };
      
      state.websocket.onclose = () => {
        console.log('Disconnected from ThreeDotts AI');
        state.isConnected = false;
        updateUI();
      };
      
      state.websocket.onerror = (error) => {
        console.error('WebSocket error details:', error, 'URL was:', signedUrl);
        state.isConnected = false;
        updateUI();
      };
      
    } catch (error) {
      console.error('Failed to connect - full error:', error);
      state.isConnected = false;
      updateUI();
    }
    }
  }

  // Disconnect WebSocket
  function disconnectWebSocket() {
    if (state.websocket) {
      state.websocket.close();
      state.websocket = null;
    }
    state.isConnected = false;
    updateUI();
  }

  // Toggle mute
  function toggleMute() {
    state.isMuted = !state.isMuted;
    updateUI();
    console.log(state.isMuted ? 'Muted' : 'Unmuted');
  }

  // Global API
  window.threedottsWidget = {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    toggleConnection: () => {
      if (state.isConnected) {
        disconnectWebSocket();
      } else {
        connectWebSocket();
      }
    },
    toggleMute: toggleMute,
    configure: (options) => {
      Object.assign(config, options);
    }
  };

  // Initialize widget
  function initWidget() {
    injectStyles();
    createWidget();
    updateUI();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (state.websocket) {
      state.websocket.close();
    }
  });
})();
    `;

    return new Response(widgetScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for debugging
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error serving widget script:', error);
    return new Response('Error loading widget script', {
      status: 500,
      headers: corsHeaders,
    });
  }
};

Deno.serve(serve);