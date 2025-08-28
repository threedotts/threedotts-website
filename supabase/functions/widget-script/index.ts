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
    agentId: null,
    theme: 'light',
    position: 'bottom-right'
  };

  // Widget iframe reference
  let widgetIframe = null;
  let isWidgetReady = false;

  // Inject iframe styles
  function injectStyles() {
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
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget iframe
  function createWidget() {
    // Check if widget already exists
    const existingWidget = document.getElementById('threedotts-widget-iframe');
    if (existingWidget) {
      console.log('🔄 Widget iframe already exists, reusing...');
      widgetIframe = existingWidget;
      isWidgetReady = true; // Assume existing widget is ready
      return;
    }
    
    console.log('🏗️ Creating widget iframe...');
    
    // Create iframe element
    widgetIframe = document.createElement('iframe');
    widgetIframe.id = 'threedotts-widget-iframe';
    widgetIframe.src = 'https://d641cc7c-1eb2-4b38-9c11-73630dae5f26.sandbox.lovable.dev/embedded-widget';
    widgetIframe.allow = 'microphone';
    widgetIframe.title = 'ThreeDotts AI Widget';
    
    // Append to body
    document.body.appendChild(widgetIframe);
    
    console.log('✅ Widget iframe created');
  }

  // Message handling between parent window and iframe
  function handleIframeMessage(event) {
    // Security check - ensure message is from our iframe
    if (event.source !== widgetIframe.contentWindow) return;
    
    console.log('📨 Received message from widget iframe:', event.data);
    
    if (event.data.type === 'WIDGET_READY') {
      console.log('✅ Widget iframe is ready');
      isWidgetReady = true;
      
      // Send configuration to iframe
      sendConfigToIframe();
    }
  }

  // Send configuration to iframe
  function sendConfigToIframe() {
    if (!isWidgetReady || !widgetIframe) return;
    
    console.log('📤 Sending configuration to iframe:', config);
    
    widgetIframe.contentWindow.postMessage({
      type: 'CONFIGURE_WIDGET',
      config: config
    }, '*');
  }

  // Global API - iframe-based widget interface
  window.threedottsWidget = {
    configure: (options) => {
      console.log('🔧 Configuring widget with options:', options);
      Object.assign(config, options);
      console.log('✅ Widget configuration updated:', config);
      
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

  // Initialize widget when DOM is ready
  function initWidget() {
    console.log('🚀 Initializing ThreeDotts embedded widget...');
    
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

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (widgetIframe) {
      widgetIframe.remove();
    }
    window.removeEventListener('message', handleIframeMessage);
  });
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