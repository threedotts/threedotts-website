(function() {
  'use strict';
  
  // Namespace to avoid conflicts
  window.ThreeDotsWidget = window.ThreeDotsWidget || {};
  
  // Prevent multiple initializations
  if (window.ThreeDotsWidget.initialized) return;
  window.ThreeDotsWidget.initialized = true;

  // Widget configuration
  const config = {
    apiUrl: 'wss://api.elevenlabs.io/v1/convai/conversation',
    agentId: 'your-agent-id', // This can be configured via data attributes
  };

  // Widget state
  let state = {
    isConnected: false,
    isMuted: false,
    websocket: null,
    audioContext: null,
    audioRecorder: null,
    audioPlayer: null
  };

  // Inject CSS styles
  function injectStyles() {
    const styleId = 'threedotts-widget-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
      .threedotts-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .threedotts-widget-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 50px;
        padding: 8px 16px 8px 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .threedotts-widget-container.connected {
        border-color: rgba(59, 130, 246, 0.3);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }
      
      .threedotts-widget-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .threedotts-widget-avatar svg {
        width: 24px;
        height: 24px;
        color: rgba(0, 0, 0, 0.6);
      }
      
      .threedotts-widget-button {
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        font-weight: 500;
      }
      
      .threedotts-widget-button:hover {
        opacity: 0.9;
        transform: scale(1.05);
      }
      
      .threedotts-widget-call-btn {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 8px 16px;
        border-radius: 50px;
        width: auto;
        height: auto;
        gap: 4px;
      }
      
      .threedotts-widget-end-btn {
        background: #ef4444;
        color: white;
      }
      
      .threedotts-widget-mute-btn {
        background: rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.7);
      }
      
      .threedotts-widget-mute-btn.muted {
        background: #ef4444;
        color: white;
      }
      
      .threedotts-widget-controls {
        display: flex;
        gap: 8px;
        animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      .threedotts-widget-powered {
        font-size: 10px;
        color: rgba(0, 0, 0, 0.5);
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
      
      @media (prefers-color-scheme: dark) {
        .threedotts-widget-container {
          background: rgba(0, 0, 0, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .threedotts-widget-avatar {
          background: rgba(255, 255, 255, 0.1);
        }
        .threedotts-widget-avatar svg {
          color: rgba(255, 255, 255, 0.6);
        }
        .threedotts-widget-mute-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }
        .threedotts-widget-powered {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget DOM elements
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'threedotts-widget';
    widget.innerHTML = `
      <div class="threedotts-widget-container" id="threedotts-container">
        <div class="threedotts-widget-avatar">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div id="threedotts-buttons">
          <button class="threedotts-widget-button threedotts-widget-call-btn" id="threedotts-call-btn">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
            Ligar
          </button>
        </div>
      </div>
      <p class="threedotts-widget-powered">Powered by threedotts AI</p>
    `;

    return widget;
  }

  // WebSocket connection management
  function connectWebSocket() {
    try {
      // This would need to be configured with your actual WebSocket endpoint
      state.websocket = new WebSocket(`${config.apiUrl}?agent_id=${config.agentId}`);
      
      state.websocket.onopen = function() {
        state.isConnected = true;
        updateUI();
        // ThreeDotts widget connected
      };

      state.websocket.onclose = function() {
        state.isConnected = false;
        updateUI();
        // ThreeDotts widget disconnected
      };

      state.websocket.onerror = function(error) {
        // ThreeDotts widget error handled silently
        state.isConnected = false;
        updateUI();
      };

      state.websocket.onmessage = function(event) {
        // Handle incoming messages
        // ThreeDotts widget message processed
      };
    } catch (error) {
      // Failed to connect ThreeDotts widget
    }
  }

  function disconnectWebSocket() {
    if (state.websocket) {
      state.websocket.close();
      state.websocket = null;
    }
    state.isConnected = false;
    updateUI();
  }

  function toggleMute() {
    state.isMuted = !state.isMuted;
    updateUI();
    // Implement actual mute logic here
  }

  // Update UI based on state
  function updateUI() {
    const container = document.getElementById('threedotts-container');
    const buttonsContainer = document.getElementById('threedotts-buttons');
    
    if (!container || !buttonsContainer) return;

    // Update container class
    if (state.isConnected) {
      container.classList.add('connected');
    } else {
      container.classList.remove('connected');
    }

    // Update buttons
    if (state.isConnected) {
      buttonsContainer.innerHTML = `
        <div class="threedotts-widget-controls">
          <button class="threedotts-widget-button threedotts-widget-end-btn" id="threedotts-end-btn">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.73 4.27a.75.75 0 0 0-1.06 0L12 8.94 7.33 4.27a.75.75 0 0 0-1.06 1.06L10.94 10l-4.67 4.67a.75.75 0 1 0 1.06 1.06L12 11.06l4.67 4.67a.75.75 0 1 0 1.06-1.06L13.06 10l4.67-4.67a.75.75 0 0 0 0-1.06z"/>
            </svg>
          </button>
          <button class="threedotts-widget-button threedotts-widget-mute-btn ${state.isMuted ? 'muted' : ''}" id="threedotts-mute-btn">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              ${state.isMuted ? 
                '<path d="M3 7h3l3-3v12l-3-3H3V7zm9 9V8l4.5 4.5L12 16z"/>' :
                '<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1h2v1a5 5 0 0 0 10 0v-1h2z"/>'
              }
            </svg>
          </button>
        </div>
      `;

      // Add event listeners for new buttons
      document.getElementById('threedotts-end-btn')?.addEventListener('click', disconnectWebSocket);
      document.getElementById('threedotts-mute-btn')?.addEventListener('click', toggleMute);
    } else {
      buttonsContainer.innerHTML = `
        <button class="threedotts-widget-button threedotts-widget-call-btn" id="threedotts-call-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
          Ligar
        </button>
      `;

      // Add event listener for call button
      document.getElementById('threedotts-call-btn')?.addEventListener('click', connectWebSocket);
    }
  }

  // Initialize widget
  function initWidget() {
    // Check if widget already exists
    if (document.querySelector('.threedotts-widget')) return;

    // Get configuration from script tag data attributes
    const scriptTag = document.querySelector('script[src*="threedotts-widget.js"]');
    if (scriptTag) {
      config.agentId = scriptTag.getAttribute('data-agent-id') || config.agentId;
    }

    // Inject styles and create widget
    injectStyles();
    const widget = createWidget();
    document.body.appendChild(widget);

    // Add initial event listener
    document.getElementById('threedotts-call-btn')?.addEventListener('click', connectWebSocket);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    if (state.websocket) {
      state.websocket.close();
    }
  });

})();