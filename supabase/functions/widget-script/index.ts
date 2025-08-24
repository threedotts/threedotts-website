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
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .threedotts-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        min-width: 120px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .threedotts-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 18px;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .threedotts-avatar:hover {
        transform: scale(1.05);
      }
      
      .threedotts-button {
        background: #667eea;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center;
      }
      
      .threedotts-button:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }
      
      .threedotts-button.danger {
        background: #e53e3e;
      }
      
      .threedotts-button.danger:hover {
        background: #c53030;
      }
      
      .threedotts-button.muted {
        background: #718096;
      }
      
      .threedotts-powered {
        font-size: 10px;
        color: #666;
        text-align: center;
        margin-top: 4px;
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
      
      @media (max-width: 768px) {
        #threedotts-widget {
          bottom: 16px;
          right: 16px;
        }
      }
      
      @media (prefers-color-scheme: dark) {
        .threedotts-container {
          background: rgba(26, 32, 44, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .threedotts-powered {
          color: #a0aec0;
        }
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
      <div class="threedotts-container">
        <div class="threedotts-avatar" onclick="window.threedottsWidget.toggleConnection()">
          AI
        </div>
        <div id="threedotts-buttons">
          <button class="threedotts-button" onclick="window.threedottsWidget.toggleConnection()">
            Call
          </button>
        </div>
        <div class="threedotts-powered">
          Powered by threedotts AI
        </div>
      </div>
    \`;
    
    document.body.appendChild(widget);
  }

  // Update UI based on state
  function updateUI() {
    const buttonsContainer = document.getElementById('threedotts-buttons');
    if (!buttonsContainer) return;
    
    if (state.isConnected) {
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button danger" onclick="window.threedottsWidget.disconnect()">
          End Call
        </button>
        <button class="threedotts-button \${state.isMuted ? 'muted' : ''}" onclick="window.threedottsWidget.toggleMute()">
          \${state.isMuted ? 'Unmute' : 'Mute'}
        </button>
      \`;
    } else {
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
          Call
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

      const wsUrl = \`\${config.wsApiUrl}/\${agentId}\`;
      state.websocket = new WebSocket(wsUrl);
      
      state.websocket.onopen = () => {
        console.log('Connected to ThreeDotts AI');
        state.isConnected = true;
        updateUI();
      };
      
      state.websocket.onclose = () => {
        console.log('Disconnected from ThreeDotts AI');
        state.isConnected = false;
        updateUI();
      };
      
      state.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        state.isConnected = false;
        updateUI();
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
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
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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