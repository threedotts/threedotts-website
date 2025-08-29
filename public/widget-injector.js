// ThreeDotts Persistent Widget Injector
// This script maintains a persistent iframe across page navigations
(function() {
    'use strict';
    
    console.log('🚀 [WIDGET INJECTOR] Loading ThreeDotts persistent widget injector...');
    
    const WIDGET_ID = 'threedotts-persistent-widget';
    const ORGANIZATION_ID = '1e926240-b303-444b-9f8c-57abd9fa657b';
    
    // Check if widget iframe already exists
    let existingWidget = document.getElementById(WIDGET_ID);
    
    if (existingWidget) {
        console.log('✅ [WIDGET INJECTOR] Widget iframe already exists, skipping creation');
        return;
    }
    
    console.log('🔧 [WIDGET INJECTOR] Creating new persistent widget iframe...');
    
    // Create the persistent iframe
    const iframe = document.createElement('iframe');
    iframe.id = WIDGET_ID;
    iframe.src = `/widget-persistent.html?organizationId=${ORGANIZATION_ID}`;
    iframe.style.cssText = `
        position: fixed !important;
        bottom: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important;
        pointer-events: auto !important;
        z-index: 9999 !important;
    `;
    iframe.title = 'ThreeDotts AI Assistant';
    
    // Add event listeners
    iframe.onload = () => {
        console.log('✅ [WIDGET INJECTOR] Persistent iframe loaded successfully');
    };
    
    iframe.onerror = () => {
        console.error('❌ [WIDGET INJECTOR] Persistent iframe failed to load');
    };
    
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
        console.log('📨 [WIDGET INJECTOR] Received message from widget:', event.data);
        
        if (event.data.type === 'openExternalURL') {
            console.log('🌐 [WIDGET INJECTOR] Opening external URL:', event.data.url);
            window.open(event.data.url, '_blank');
        } else if (event.data.type === 'navigate') {
            console.log('📍 [WIDGET INJECTOR] Navigating to:', event.data.url);
            window.location.href = event.data.url;
        } else if (event.data.type === 'widgetReady') {
            console.log('✅ [WIDGET INJECTOR] Widget reported ready');
        }
    });
    
    // Append to body when DOM is ready
    const appendWidget = () => {
        if (document.body) {
            document.body.appendChild(iframe);
            console.log('✅ [WIDGET INJECTOR] Widget iframe added to DOM');
            
            // Send a ping to test communication
            setTimeout(() => {
                iframe.contentWindow?.postMessage({ type: 'ping' }, '*');
            }, 1000);
        } else {
            setTimeout(appendWidget, 10);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendWidget);
    } else {
        appendWidget();
    }
    
    console.log('🎯 [WIDGET INJECTOR] Widget injector setup complete');
})();