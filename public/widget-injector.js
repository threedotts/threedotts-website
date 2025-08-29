// ThreeDotts Persistent Widget Injector using SharedWorker
// This script uses SharedWorker to maintain WebSocket connection across page navigations
(function() {
    'use strict';
    
    console.log('🚀 [WIDGET INJECTOR] Loading ThreeDotts persistent widget injector with SharedWorker...');
    
    const MANAGER_SCRIPT_ID = 'threedotts-widget-manager';
    
    // Check if manager script already exists
    let existingScript = document.getElementById(MANAGER_SCRIPT_ID);
    
    if (existingScript) {
        console.log('✅ [WIDGET INJECTOR] Widget manager already loaded, skipping');
        return;
    }
    
    console.log('🔧 [WIDGET INJECTOR] Loading persistent widget manager...');
    
    // Load the persistent widget manager script
    const script = document.createElement('script');
    script.id = MANAGER_SCRIPT_ID;
    script.src = '/persistent-widget-manager.js';
    script.onload = () => {
        console.log('✅ [WIDGET INJECTOR] Persistent widget manager loaded successfully');
    };
    
    script.onerror = () => {
        console.error('❌ [WIDGET INJECTOR] Failed to load persistent widget manager');
    };
    
    // Append script when DOM is ready
    const appendScript = () => {
        if (document.head) {
            document.head.appendChild(script);
            console.log('✅ [WIDGET INJECTOR] Widget manager script added to DOM');
        } else {
            setTimeout(appendScript, 10);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendScript);
    } else {
        appendScript();
    }
    
    console.log('🎯 [WIDGET INJECTOR] SharedWorker-based widget injector setup complete');
})();