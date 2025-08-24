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
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 9999px;
        padding: 8px 16px 8px 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .threedotts-container.connected {
        border-color: rgba(102, 126, 234, 0.3);
        box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.2), 0 2px 4px -1px rgba(102, 126, 234, 0.1);
      }
      
      .threedotts-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .threedotts-avatar-inner {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(0, 0, 0, 0.4);
      }
      
      .threedotts-avatar svg {
        width: 24px;
        height: 24px;
      }
      
      .threedotts-call-button {
        background: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%);
        color: white;
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
        opacity: 1;
      }
      
      .threedotts-call-button:hover {
        opacity: 0.9;
      }
      
      .threedotts-action-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      
      .threedotts-end-call {
        background: #e53e3e;
        color: white;
      }
      
      .threedotts-end-call:hover {
        background: #c53030;
      }
      
      .threedotts-mute {
        background: #718096;
        color: white;
      }
      
      .threedotts-mute:hover {
        background: #4a5568;
      }
      
      .threedotts-mute.muted {
        background: #e53e3e;
      }
      
      .threedotts-powered {
        font-size: 10px;
        color: #666;
        text-align: right;
        margin-top: 8px;
      }
      
      .threedotts-buttons {
        display: flex;
        gap: 8px;
        animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: center;
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
        
        .threedotts-avatar-inner {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(160, 174, 192, 1);
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
        <div class="threedotts-avatar">
          <div class="threedotts-avatar-inner">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        <div id="threedotts-buttons">
          <button class="threedotts-call-button" onclick="window.threedottsWidget.toggleConnection()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02A11.36 11.36 0 0 1 8.64 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.64c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
            </svg>
            Ligar
          </button>
        </div>
      </div>
      <div class="threedotts-powered">
        Powered by threedotts AI
      </div>
    \`;
    
    document.body.appendChild(widget);
  }

  // Update UI based on state
  function updateUI() {
    const buttonsContainer = document.getElementById('threedotts-buttons');
    const container = document.querySelector('.threedotts-container');
    if (!buttonsContainer || !container) return;
    
    if (state.isConnected) {
      container.classList.add('connected');
      buttonsContainer.innerHTML = \`
        <div class="threedotts-buttons">
          <button class="threedotts-action-button threedotts-end-call" onclick="window.threedottsWidget.disconnect()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41L2.46 9.5c.18-.18.43-.28.7-.28.28 0 .53.11.71.29.79.73 1.68 1.36 2.66 1.85.33.16.56.51.56.9v3.1c1.45.47 2.99.72 4.6.72s3.15-.25 4.6-.72v-3.1c0-.39.23-.74.56-.9.98-.49 1.87-1.12 2.66-1.85.18-.18.43-.28.7-.28.28 0 .53.11.71.29l2.17 2.17a.996.996 0 0 1 0 1.41l-2.17 2.17c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </button>
          <button class="threedotts-action-button threedotts-mute \${state.isMuted ? 'muted' : ''}" onclick="window.threedottsWidget.toggleMute()">
            \${state.isMuted ? 
              '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-3.87-5.02-2.75-5.02-2.75S9.98 1.13 6.11 5H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2.11l4.51 4.51c.69.69 1.76.69 2.45 0 .69-.69.69-1.76 0-2.45L8.55 12H7V8h1.55l2.92-2.92c.69-.69 1.76-.69 2.45 0 .69.69.69 1.76 0 2.45L12.5 9l2.48-2.48z"/></svg>' :
              '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>'
            }
          </button>
        </div>
      \`;
    } else {
      container.classList.remove('connected');
      buttonsContainer.innerHTML = \`
        <button class="threedotts-call-button" onclick="window.threedottsWidget.connect()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02A11.36 11.36 0 0 1 8.64 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.64c0-.55-.45-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
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