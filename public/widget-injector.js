// ThreeDotts Persistent Widget Injector using SharedWorker
// This script maintains persistent connection across page navigations
(function() {
    'use strict';
    
    console.log('🚀 [WIDGET INJECTOR] Loading ThreeDotts persistent widget injector...');
    
    const ORGANIZATION_ID = '1e926240-b303-444b-9f8c-57abd9fa657b';
    const WIDGET_CONTAINER_ID = 'threedotts-persistent-widget';
    
    let sharedWorker = null;
    let workerPort = null;
    let widgetElement = null;
    let isConnected = false;
    
    // Check if widget already exists globally
    if (window.threeDottsWidgetActive) {
        console.log('✅ [WIDGET INJECTOR] Widget already active globally, connecting to existing...');
        connectToExistingWidget();
        return;
    }
    
    // Mark widget as active globally
    window.threeDottsWidgetActive = true;
    
    initializeSharedWorker();
    
    function initializeSharedWorker() {
        try {
            console.log('🔧 [WIDGET INJECTOR] Initializing SharedWorker...');
            
            sharedWorker = new SharedWorker('/shared-widget-worker.js');
            workerPort = sharedWorker.port;
            
            workerPort.onmessage = handleWorkerMessage;
            workerPort.start();
            
            // Connect to worker
            workerPort.postMessage({
                type: 'connect',
                data: { organizationId: ORGANIZATION_ID }
            });
            
        } catch (error) {
            console.error('❌ [WIDGET INJECTOR] Failed to initialize SharedWorker:', error);
        }
    }
    
    function connectToExistingWidget() {
        try {
            sharedWorker = new SharedWorker('/shared-widget-worker.js');
            workerPort = sharedWorker.port;
            workerPort.onmessage = handleWorkerMessage;
            workerPort.start();
            
            // Just listen to existing connection
            workerPort.postMessage({ type: 'ping' });
            
        } catch (error) {
            console.error('❌ [WIDGET INJECTOR] Failed to connect to existing widget:', error);
        }
    }
    
    function handleWorkerMessage(event) {
        const { type, isConnected: connected, widgetState } = event.data;
        
        switch (type) {
            case 'worker_ready':
                console.log('✅ [WIDGET INJECTOR] Worker ready, connected:', connected);
                isConnected = connected;
                
                // Only create widget if it doesn't exist
                if (!document.getElementById(WIDGET_CONTAINER_ID)) {
                    createWidget();
                }
                break;
                
            case 'websocket_connected':
                isConnected = true;
                updateWidgetStatus('connected');
                break;
                
            case 'websocket_disconnected':
                isConnected = false;
                updateWidgetStatus('disconnected');
                break;
                
            case 'widget_state_updated':
                if (widgetState) {
                    updateWidgetFromState(widgetState);
                }
                break;
        }
    }
    
    function createWidget() {
        console.log('🎨 [WIDGET INJECTOR] Creating persistent widget...');
        
        const container = document.createElement('div');
        container.id = WIDGET_CONTAINER_ID;
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            cursor: pointer;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 1c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
                <path d="M6 10v2c0 3.31 2.69 6 6 6s6-2.69 6-6v-2"/>
                <path d="M12 19v3"/>
                <path d="M9 22h6"/>
            </svg>
        `;
        container.appendChild(icon);
        
        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'widget-status';
        statusIndicator.style.cssText = `
            position: absolute;
            top: -2px;
            right: -2px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ff4444;
            border: 2px solid white;
        `;
        container.appendChild(statusIndicator);
        
        container.addEventListener('click', () => {
            if (workerPort) {
                workerPort.postMessage({
                    type: 'start_conversation',
                    data: { organizationId: ORGANIZATION_ID }
                });
            }
        });
        
        document.body.appendChild(container);
        widgetElement = container;
        
        updateWidgetStatus(isConnected ? 'connected' : 'disconnected');
        console.log('✅ [WIDGET INJECTOR] Persistent widget created');
    }
    
    function updateWidgetStatus(status) {
        const indicator = document.getElementById('widget-status');
        if (!indicator) return;
        
        switch (status) {
            case 'connected':
                indicator.style.background = '#44ff44';
                break;
            case 'disconnected':
                indicator.style.background = '#ff4444';
                break;
        }
    }
    
    function updateWidgetFromState(state) {
        if (!widgetElement) return;
        
        if (state.isSpeaking) {
            widgetElement.style.border = '3px solid #44ff44';
            widgetElement.style.animation = 'pulse 1s infinite';
        } else {
            widgetElement.style.border = 'none';
            widgetElement.style.animation = 'none';
        }
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    console.log('🎯 [WIDGET INJECTOR] Setup complete');
})();