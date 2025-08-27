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
  
  // Storage keys for persistence
  const STORAGE_KEY = 'threedotts-widget-state';
  const CONFIG_KEY = 'threedotts-widget-config';
  
  // Configuration
  let config = {
    agentId: null,
    theme: 'light',
    position: 'bottom-right'
  };

  // Widget iframe reference
  let widgetIframe = null;
  let isWidgetReady = false;

  // Load persisted state and config
  function loadPersistedData() {
    try {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        config = { ...config, ...JSON.parse(savedConfig) };
        console.log('📦 Loaded persisted config:', config);
      }
    } catch (error) {
      console.warn('Failed to load persisted config:', error);
    }
  }

  // Save config to localStorage
  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }

  // Inject iframe styles
  function injectStyles() {
    // Check if styles already exist
    if (document.getElementById('threedotts-widget-styles')) {
      return;
    }
    
    const styles = \`
      #threedotts-widget-iframe {
        position: fixed !important;
        bottom: 0 !important;
        right: 0 !important;
        width: 380px !important;
        height: 120px !important;
        border: none !important;
        z-index: 2147483647 !important;
        background: transparent !important;
        pointer-events: auto !important;
      }
      
      #threedotts-widget-iframe.expanded {
        height: 600px !important;
      }
    \`;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'threedotts-widget-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget iframe
  function createWidget() {
    // Check if widget already exists
    const existingWidget = document.getElementById('threedotts-widget-iframe');
    if (existingWidget) {
      console.log('🔄 Widget iframe already exists, reconnecting...');
      widgetIframe = existingWidget;
      
      // Don't reset ready state - the iframe is still functional
      // Just check if we need to resend config
      if (isWidgetReady) {
        setTimeout(() => {
          sendConfigToIframe();
        }, 500);
      }
      return;
    }
    
    console.log('🏗️ Creating widget iframe...');
    
    // Create iframe element
    widgetIframe = document.createElement('iframe');
    widgetIframe.id = 'threedotts-widget-iframe';
    
    // Add session parameter to maintain state across navigations
    const sessionId = sessionStorage.getItem('threedotts-session-id') || 
                     Math.random().toString(36).substring(7);
    sessionStorage.setItem('threedotts-session-id', sessionId);
    
    widgetIframe.src = \`https://d641cc7c-1eb2-4b38-9c11-73630dae5f26.sandbox.lovable.dev/embedded-widget?sessionId=\${sessionId}\`;
    widgetIframe.allow = 'microphone';
    widgetIframe.title = 'ThreeDotts AI Widget';
    
    // Append to body
    document.body.appendChild(widgetIframe);
    
    console.log('✅ Widget iframe created with session:', sessionId);
  }

  // Message handling between parent window and iframe
  function handleIframeMessage(event) {
    // Security check - ensure message is from our iframe
    if (event.source !== widgetIframe?.contentWindow) return;
    
    console.log('📨 Received message from widget iframe:', event.data);
    
    if (event.data.type === 'WIDGET_READY') {
      console.log('✅ Widget iframe is ready');
      isWidgetReady = true;
      
      // Send configuration and any persisted state to iframe
      sendConfigToIframe();
    } else if (event.data.type === 'WIDGET_STATE_UPDATE') {
      // Save state updates from iframe
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.state));
      } catch (error) {
        console.warn('Failed to save widget state:', error);
      }
    }
  }

  // Send configuration to iframe
  function sendConfigToIframe() {
    if (!isWidgetReady || !widgetIframe) return;
    
    console.log('📤 Sending configuration to iframe:', config);
    
    // Get persisted state
    let persistedState = null;
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        persistedState = JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
    
    widgetIframe.contentWindow.postMessage({
      type: 'CONFIGURE_WIDGET',
      config: config,
      persistedState: persistedState
    }, '*');
  }

  // Global API - iframe-based widget interface
  window.threedottsWidget = {
    configure: (options) => {
      console.log('🔧 Configuring widget with options:', options);
      Object.assign(config, options);
      console.log('✅ Widget configuration updated:', config);
      
      // Save config to localStorage
      saveConfig();
      
      // Send updated config to iframe if ready
      if (isWidgetReady) {
        sendConfigToIframe();
      }
    },
    
    // Legacy methods for backward compatibility
    connect: () => {
      console.log('📞 Connect called - this is handled by the iframe widget');
    },
    disconnect: () => {
      console.log('📴 Disconnect called - this is handled by the iframe widget');
    },
    toggleMute: () => {
      console.log('🔇 Toggle mute called - this is handled by the iframe widget');
    }
  };

  // Check if widget is already initialized globally
  function isWidgetAlreadyInitialized() {
    // Check if the iframe already exists in the DOM
    const existingWidget = document.getElementById('threedotts-widget-iframe');
    if (existingWidget) {
      console.log('🔄 Widget already exists globally, attaching to existing instance');
      widgetIframe = existingWidget;
      isWidgetReady = true;
      
      // Reattach message listener
      window.addEventListener('message', handleIframeMessage);
      
      // Send config immediately since widget is ready
      setTimeout(() => {
        sendConfigToIframe();
      }, 100);
      
      return true;
    }
    return false;
  }

  // Initialize widget when DOM is ready
  function initWidget() {
    console.log('🚀 Initializing ThreeDotts embedded widget...');
    
    // Load persisted data first
    loadPersistedData();
    
    // Check if widget already exists
    if (isWidgetAlreadyInitialized()) {
      console.log('✅ Widget reattached to existing instance');
      return;
    }
    
    injectStyles();
    createWidget();
    
    // Add message listener for iframe communication
    window.addEventListener('message', handleIframeMessage);
    
    console.log('✅ Widget initialization complete');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Don't cleanup on page unload - let the widget persist
  // Only clean up if explicitly requested
  window.threedottsWidget.destroy = () => {
    if (widgetIframe) {
      widgetIframe.remove();
    }
    window.removeEventListener('message', handleIframeMessage);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIG_KEY);
    sessionStorage.removeItem('threedotts-session-id');
  };
})();
    `;

    return new Response(widgetScript, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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