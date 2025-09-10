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
        /* Complete isolation from page layout */
        all: initial !important;
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        transform: none !important;
        width: auto !important;
        height: auto !important;
        max-width: none !important;
        max-height: none !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: visible !important;
        clip: none !important;
        clip-path: none !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        filter: none !important;
        backdrop-filter: none !important;
        isolation: isolate !important;
      }
      
      .threedotts-widget-container {
        /* Reset all inherited styles */
        all: unset !important;
        /* Apply only our specific styles */
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border-radius: 50px !important;
        padding: 8px 16px 8px 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        /* Additional isolation */
        position: relative !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        width: auto !important;
        height: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: none !important;
        max-height: none !important;
        overflow: visible !important;
        text-align: left !important;
        direction: ltr !important;
        unicode-bidi: normal !important;
        writing-mode: horizontal-tb !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
        text-transform: none !important;
        text-indent: 0 !important;
        text-shadow: none !important;
        white-space: normal !important;
        word-wrap: normal !important;
        word-break: normal !important;
        hyphens: none !important;
        vertical-align: baseline !important;
        color: inherit !important;
        font-weight: normal !important;
        font-style: normal !important;
        font-variant: normal !important;
        text-decoration: none !important;
        list-style: none !important;
        quotes: none !important;
        counter-reset: none !important;
        counter-increment: none !important;
      }
      
      .threedotts-widget-container.connected {
        border-color: rgba(59, 130, 246, 0.3);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }
      
      .threedotts-widget-avatar {
        all: unset !important;
        width: 40px !important;
        height: 40px !important;
        border-radius: 50% !important;
        background: rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
        position: relative !important;
      }
      
      .threedotts-widget-avatar svg {
        width: 24px;
        height: 24px;
        color: rgba(0, 0, 0, 0.6);
      }
      
      .threedotts-widget-button {
        all: unset !important;
        border: none !important;
        border-radius: 50% !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-sizing: border-box !important;
        position: relative !important;
        flex-shrink: 0 !important;
        outline: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      .threedotts-widget-button:hover {
        opacity: 0.9;
        transform: scale(1.05);
      }
      
      .threedotts-widget-call-btn {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
        color: white !important;
        padding: 8px 16px !important;
        border-radius: 50px !important;
        width: auto !important;
        height: auto !important;
        gap: 4px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        text-decoration: none !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
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
        all: unset !important;
        display: flex !important;
        gap: 8px !important;
        animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
      }
      
      .threedotts-widget-powered {
        all: unset !important;
        font-size: 10px !important;
        color: rgba(0, 0, 0, 0.5) !important;
        text-align: right !important;
        margin-top: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        display: block !important;
        line-height: 1.2 !important;
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
        console.log('ThreeDotts widget connected');
      };

      state.websocket.onclose = function() {
        state.isConnected = false;
        updateUI();
        console.log('ThreeDotts widget disconnected');
      };

      state.websocket.onerror = function(error) {
        console.error('ThreeDotts widget error:', error);
        state.isConnected = false;
        updateUI();
      };

      state.websocket.onmessage = function(event) {
        // Handle incoming messages
        console.log('ThreeDotts widget message:', event.data);
      };
    } catch (error) {
      console.error('Failed to connect ThreeDotts widget:', error);
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