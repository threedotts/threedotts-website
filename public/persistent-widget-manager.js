// Gerenciador de Widget Persistente
// Este script coordena a conexão SharedWorker e a UI do widget

(function() {
    'use strict';
    
    console.log('🚀 [WIDGET MANAGER] Loading persistent widget manager...');
    
    const ORGANIZATION_ID = '1e926240-b303-444b-9f8c-57abd9fa657b';
    const WIDGET_CONTAINER_ID = 'threedotts-persistent-container';
    
    let sharedWorker = null;
    let workerPort = null;
    let widgetElement = null;
    let isWidgetVisible = false;
    let audioContext = null;
    let isConnected = false;
    let isSpeaking = false;
    
    // Verificar suporte ao SharedWorker
    const supportsSharedWorker = typeof SharedWorker !== 'undefined';
    console.log('🔍 [WIDGET MANAGER] SharedWorker support:', supportsSharedWorker);
    
    // Inicializar SharedWorker se suportado
    if (supportsSharedWorker) {
        initializeSharedWorker();
    } else {
        console.warn('⚠️ [WIDGET MANAGER] SharedWorker not supported, falling back to regular WebSocket');
        initializeFallbackMode();
    }
    
    function initializeSharedWorker() {
        try {
            console.log('🔧 [WIDGET MANAGER] Initializing SharedWorker...');
            
            sharedWorker = new SharedWorker('/shared-widget-worker.js');
            workerPort = sharedWorker.port;
            
            workerPort.onmessage = handleWorkerMessage;
            workerPort.onmessageerror = (error) => {
                console.error('❌ [WIDGET MANAGER] Worker message error:', error);
            };
            
            workerPort.start();
            
            // Conectar ao worker
            workerPort.postMessage({
                type: 'connect',
                data: { organizationId: ORGANIZATION_ID }
            });
            
            console.log('✅ [WIDGET MANAGER] SharedWorker initialized');
            
        } catch (error) {
            console.error('❌ [WIDGET MANAGER] Failed to initialize SharedWorker:', error);
            initializeFallbackMode();
        }
    }
    
    function handleWorkerMessage(event) {
        const { type, data, isConnected: connected, error } = event.data;
        console.log('📨 [WIDGET MANAGER] Worker message:', type);
        
        switch (type) {
            case 'worker_ready':
                console.log('✅ [WIDGET MANAGER] Worker ready, connected:', connected);
                isConnected = connected;
                initializeWidget();
                break;
                
            case 'websocket_connected':
                console.log('🔌 [WIDGET MANAGER] WebSocket connected');
                isConnected = true;
                updateWidgetStatus('connected');
                break;
                
            case 'websocket_disconnected':
                console.log('🔌 [WIDGET MANAGER] WebSocket disconnected');
                isConnected = false;
                updateWidgetStatus('disconnected');
                break;
                
            case 'websocket_message':
                handleWebSocketMessage(data);
                break;
                
            case 'websocket_error':
                console.error('❌ [WIDGET MANAGER] WebSocket error:', error);
                updateWidgetStatus('error');
                break;
                
            case 'pong':
                console.log('🏓 [WIDGET MANAGER] Pong received');
                break;
        }
    }
    
    function handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('📨 [WIDGET MANAGER] WebSocket message type:', message.type);
            
            switch (message.type) {
                case 'conversation.created':
                    console.log('✅ [WIDGET MANAGER] Conversation created');
                    break;
                    
                case 'audio':
                    if (message.data) {
                        playAudioData(message.data);
                    }
                    break;
                    
                case 'speech_started':
                    isSpeaking = true;
                    updateSpeakingStatus(true);
                    break;
                    
                case 'speech_stopped':
                    isSpeaking = false;
                    updateSpeakingStatus(false);
                    break;
                    
                case 'error':
                    console.error('❌ [WIDGET MANAGER] Server error:', message.message);
                    break;
            }
        } catch (error) {
            console.error('❌ [WIDGET MANAGER] Error parsing WebSocket message:', error);
        }
    }
    
    function initializeWidget() {
        console.log('🎨 [WIDGET MANAGER] Initializing widget UI...');
        
        // Verificar se já existe
        if (document.getElementById(WIDGET_CONTAINER_ID)) {
            console.log('⚠️ [WIDGET MANAGER] Widget container already exists');
            return;
        }
        
        // Criar container do widget
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
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            border: 3px solid transparent;
        `;
        
        // Ícone do microfone
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
        statusIndicator.id = 'widget-status-indicator';
        statusIndicator.style.cssText = `
            position: absolute;
            top: -2px;
            right: -2px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ff4444;
            border: 2px solid white;
            transition: background 0.3s ease;
        `;
        container.appendChild(statusIndicator);
        
        // Event listeners
        container.addEventListener('click', toggleWidget);
        container.addEventListener('mouseenter', () => {
            container.style.transform = 'scale(1.1)';
        });
        container.addEventListener('mouseleave', () => {
            container.style.transform = 'scale(1)';
        });
        
        // Adicionar ao DOM
        document.body.appendChild(container);
        widgetElement = container;
        
        // Atualizar status inicial
        updateWidgetStatus(isConnected ? 'connected' : 'disconnected');
        
        console.log('✅ [WIDGET MANAGER] Widget UI initialized');
    }
    
    function updateWidgetStatus(status) {
        const indicator = document.getElementById('widget-status-indicator');
        if (!indicator) return;
        
        switch (status) {
            case 'connected':
                indicator.style.background = '#44ff44';
                break;
            case 'connecting':
                indicator.style.background = '#ffaa44';
                break;
            case 'disconnected':
            case 'error':
                indicator.style.background = '#ff4444';
                break;
        }
    }
    
    function updateSpeakingStatus(speaking) {
        if (!widgetElement) return;
        
        if (speaking) {
            widgetElement.style.borderColor = '#44ff44';
            widgetElement.style.animation = 'pulse 1s infinite';
        } else {
            widgetElement.style.borderColor = 'transparent';
            widgetElement.style.animation = 'none';
        }
    }
    
    function toggleWidget() {
        console.log('🎯 [WIDGET MANAGER] Widget clicked');
        
        if (!isConnected) {
            console.log('⚠️ [WIDGET MANAGER] Not connected, attempting to reconnect...');
            if (workerPort) {
                workerPort.postMessage({
                    type: 'connect',
                    data: { organizationId: ORGANIZATION_ID }
                });
            }
            return;
        }
        
        // Implementar lógica de toggle do widget aqui
        startConversation();
    }
    
    async function startConversation() {
        console.log('🎤 [WIDGET MANAGER] Starting conversation...');
        
        try {
            // Inicializar AudioContext se necessário
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Pedir permissão do microfone
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 24000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('✅ [WIDGET MANAGER] Microphone access granted');
            
            // Implementar gravação de áudio aqui
            // Por agora, apenas simular início da conversa
            if (workerPort) {
                workerPort.postMessage({
                    type: 'send_message',
                    data: {
                        message: {
                            type: 'conversation.start',
                            organizationId: ORGANIZATION_ID
                        }
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ [WIDGET MANAGER] Error starting conversation:', error);
        }
    }
    
    async function playAudioData(audioData) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        try {
            // Decodificar dados de áudio base64
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Criar buffer de áudio
            const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
            
            // Reproduzir áudio
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            
            console.log('🔊 [WIDGET MANAGER] Audio playing');
            
        } catch (error) {
            console.error('❌ [WIDGET MANAGER] Error playing audio:', error);
        }
    }
    
    function initializeFallbackMode() {
        console.log('🔄 [WIDGET MANAGER] Initializing fallback mode...');
        // Implementar fallback sem SharedWorker se necessário
        initializeWidget();
    }
    
    // Adicionar CSS para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 [WIDGET MANAGER] DOM ready');
        });
    }
    
    console.log('✅ [WIDGET MANAGER] Widget manager initialized');
})();