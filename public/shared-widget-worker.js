// SharedWorker para manter conexão WebSocket persistente
// Este worker mantém a conexão ativa mesmo quando as páginas navegam

console.log('🚀 [SHARED WORKER] Starting ThreeDotts shared worker...');

let websocket = null;
let organizationId = null;
let isConnected = false;
let connectionAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimeout = null;
let ports = new Set();
let conversationActive = false;
let widgetState = {
  isVisible: false,
  isSpeaking: false,
  lastActivity: Date.now()
};
let heartbeatInterval = null;
let pingTimeout = null;
let lastPongReceived = Date.now();

// Função para conectar ao WebSocket
function connectWebSocket(orgId) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('🔄 [SHARED WORKER] WebSocket already connected');
        return;
    }

    organizationId = orgId;
    console.log('🔌 [SHARED WORKER] Connecting to WebSocket for org:', organizationId);

    try {
        websocket = new WebSocket(`wss://dkqzzypemdewomxrjftv.supabase.co/functions/v1/elevenlabs-websocket?voice_id=9BWtsMINqrJLrRacOk9x&model_id=eleven_multilingual_v2&organization_id=${organizationId}`);

        websocket.onopen = () => {
            console.log('✅ [SHARED WORKER] WebSocket connected');
            isConnected = true;
            connectionAttempts = 0;
            lastPongReceived = Date.now();
            
            // Start heartbeat system
            startHeartbeat();
            
            // Notificar todas as abas conectadas
            broadcastMessage({
                type: 'websocket_connected',
                timestamp: Date.now()
            });
        };

        websocket.onmessage = (event) => {
            console.log('📨 [SHARED WORKER] WebSocket message received');
            
            try {
                const message = JSON.parse(event.data);
                
                // Handle ping/pong for keep-alive
                if (message.type === 'ping') {
                    console.log('🏓 [SHARED WORKER] Received ping, sending pong');
                    sendWebSocketMessage({ type: 'pong', timestamp: Date.now() });
                    return;
                } else if (message.type === 'pong') {
                    console.log('🏓 [SHARED WORKER] Received pong');
                    lastPongReceived = Date.now();
                    return;
                }
            } catch (e) {
                // Message might not be JSON, continue processing
            }
            
            // Retransmitir mensagem para todas as abas
            broadcastMessage({
                type: 'websocket_message',
                data: event.data,
                timestamp: Date.now()
            });
        };

        websocket.onclose = (event) => {
            console.log('🔌 [SHARED WORKER] WebSocket closed:', event.code, event.reason);
            isConnected = false;
            stopHeartbeat();
            
            // Notificar todas as abas
            broadcastMessage({
                type: 'websocket_disconnected',
                code: event.code,
                reason: event.reason,
                timestamp: Date.now()
            });

            // Tentar reconectar se não foi fechado intencionalmente
            if (event.code !== 1000 && connectionAttempts < maxReconnectAttempts) {
                scheduleReconnect();
            }
        };

        websocket.onerror = (error) => {
            console.error('❌ [SHARED WORKER] WebSocket error:', error);
            stopHeartbeat();
            
            broadcastMessage({
                type: 'websocket_error',
                error: error.message || 'WebSocket error',
                timestamp: Date.now()
            });
        };

    } catch (error) {
        console.error('❌ [SHARED WORKER] Failed to create WebSocket:', error);
    }
}

// Função para iniciar o sistema de heartbeat
function startHeartbeat() {
    console.log('💓 [SHARED WORKER] Starting heartbeat system');
    
    // Clear any existing heartbeat
    stopHeartbeat();
    
    // Send ping every 25 seconds (less than server's 30 second interval)
    heartbeatInterval = setInterval(() => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            console.log('🏓 [SHARED WORKER] Sending heartbeat ping');
            sendWebSocketMessage({ type: 'ping', timestamp: Date.now() });
            
            // Check if we received a pong recently
            const timeSinceLastPong = Date.now() - lastPongReceived;
            if (timeSinceLastPong > 45000) { // 45 seconds without pong
                console.warn('⚠️ [SHARED WORKER] No pong received in 45s, connection might be dead');
                websocket.close(1000, 'Heartbeat timeout');
            }
        }
    }, 25000);
    
    // Set timeout for ping response
    pingTimeout = setTimeout(() => {
        if (isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
            const timeSinceLastPong = Date.now() - lastPongReceived;
            if (timeSinceLastPong > 60000) { // 60 seconds without any pong
                console.error('❌ [SHARED WORKER] Ping timeout, closing connection');
                websocket.close(1000, 'Ping timeout');
            }
        }
    }, 60000);
}

// Função para parar o sistema de heartbeat
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (pingTimeout) {
        clearTimeout(pingTimeout);
        pingTimeout = null;
    }
}
// Função para reconectar
function scheduleReconnect() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }

    connectionAttempts++;
    const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
    
    console.log(`🔄 [SHARED WORKER] Scheduling reconnect attempt ${connectionAttempts} in ${delay}ms`);
    
    reconnectTimeout = setTimeout(() => {
        if (organizationId) {
            connectWebSocket(organizationId);
        }
    }, delay);
}

// Função para transmitir mensagem para todas as abas
function broadcastMessage(message) {
    console.log('📡 [SHARED WORKER] Broadcasting message to', ports.size, 'ports:', message.type);
    
    ports.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            console.error('❌ [SHARED WORKER] Error sending message to port:', error);
            ports.delete(port);
        }
    });
}

// Função para enviar mensagem via WebSocket
function sendWebSocketMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('📤 [SHARED WORKER] Sending WebSocket message:', message.type);
        websocket.send(JSON.stringify(message));
        return true;
    } else {
        console.warn('⚠️ [SHARED WORKER] WebSocket not connected, cannot send message');
        return false;
    }
}

// Listener para conexões de novas abas
self.addEventListener('connect', (event) => {
    const port = event.ports[0];
    ports.add(port);
    
    console.log('🔗 [SHARED WORKER] New tab connected, total ports:', ports.size);
    
    // Enviar status atual para a nova aba
    port.postMessage({
        type: 'worker_ready',
        isConnected: isConnected,
        organizationId: organizationId,
        widgetState: widgetState,
        conversationActive: conversationActive,
        timestamp: Date.now()
    });

    port.onmessage = (event) => {
        const { type, data } = event.data;
        console.log('📨 [SHARED WORKER] Received message from tab:', type);

        switch (type) {
            case 'connect':
                if (data.organizationId) {
                    connectWebSocket(data.organizationId);
                }
                break;

            case 'disconnect':
                stopHeartbeat();
                if (websocket) {
                    websocket.close(1000, 'User requested disconnect');
                    websocket = null;
                }
                isConnected = false;
                break;

            case 'send_message':
                sendWebSocketMessage(data.message);
                break;

            case 'update_widget_state':
                widgetState = { ...widgetState, ...data.state };
                widgetState.lastActivity = Date.now();
                // Broadcast state to all tabs
                broadcastMessage({
                    type: 'widget_state_updated',
                    state: widgetState,
                    timestamp: Date.now()
                });
                break;

            case 'start_conversation':
                conversationActive = true;
                broadcastMessage({
                    type: 'conversation_started',
                    timestamp: Date.now()
                });
                break;

            case 'end_conversation':
                conversationActive = false;
                broadcastMessage({
                    type: 'conversation_ended',
                    timestamp: Date.now()
                });
                break;

            case 'ping':
                port.postMessage({
                    type: 'pong',
                    timestamp: Date.now()
                });
                break;

            default:
                console.warn('⚠️ [SHARED WORKER] Unknown message type:', type);
        }
    };

    port.onmessageerror = (error) => {
        console.error('❌ [SHARED WORKER] Port message error:', error);
    };

    port.start();
});

console.log('✅ [SHARED WORKER] SharedWorker initialized');