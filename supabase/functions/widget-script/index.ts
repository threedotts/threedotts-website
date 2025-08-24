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
    agentId: null // Will be set from URL params or config
  };

  // Widget state - exactly like useGlobalConvaiState
  const state = {
    isExpanded: false,
    isConnected: false,
    isMuted: false,
    isSpeaking: false,
    message: '',
    messages: [],
    websocket: null
  };

  // Inject CSS styles - exactly like ThreeDotsEmbeddedConvai
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
        background: hsl(var(--background, 0 0% 100%) / 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid hsl(var(--border, 220 13% 91%));
        box-shadow: 0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 9999px;
        padding: 8px 16px 8px 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .threedotts-container.connected {
        border-color: hsl(var(--primary, 220 93% 60%) / 0.3);
        box-shadow: 0 4px 6px -1px hsl(var(--primary, 220 93% 60%) / 0.2);
      }
      
      .threedotts-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(var(--muted, 220 14% 96%));
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .threedotts-avatar-inner {
        width: 100%;
        height: 100%;
        background: hsl(var(--muted-foreground, 220 8% 46%) / 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .threedotts-avatar svg {
        width: 24px;
        height: 24px;
        color: hsl(var(--muted-foreground, 220 8% 46%));
      }
      
      .threedotts-button {
        background: linear-gradient(135deg, hsl(var(--primary, 220 93% 60%)), hsl(var(--accent, 220 93% 70%)));
        color: hsl(var(--primary-foreground, 210 40% 98%));
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
        white-space: nowrap;
      }
      
      .threedotts-button:hover {
        opacity: 0.9;
      }
      
      .threedotts-button.secondary {
        background: hsl(var(--secondary, 220 14% 96%));
        color: hsl(var(--secondary-foreground, 220 9% 9%));
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
      }
      
      .threedotts-button.danger {
        background: hsl(var(--destructive, 0 84% 60%));
        color: hsl(var(--destructive-foreground, 210 40% 98%));
        width: 32px;
        height: 32px;
        padding: 0;
        justify-content: center;
      }
      
      .threedotts-controls {
        display: flex;
        gap: 8px;
        animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .threedotts-powered {
        font-size: 10px;
        color: hsl(var(--muted-foreground, 220 8% 46%));
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
      
      .animate-scale-in {
        animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Icons */
      .icon-phone {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      
      .icon-phone-off,
      .icon-mic,
      .icon-mic-off {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    \`;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget HTML - exactly like ThreeDotsEmbeddedConvai
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'threedotts-widget';
    widget.innerHTML = \`
      <div class="threedotts-container" id="threedotts-container">
        <div class="threedotts-avatar">
          <div class="threedotts-avatar-inner">
            <svg class="icon-user" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        <div id="threedotts-buttons">
          <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
            <svg class="icon-phone" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Ligar
          </button>
        </div>
      </div>
      <p class="threedotts-powered">Powered by threedotts AI</p>
    \`;
    
    document.body.appendChild(widget);
  }

  // ElevenLabsWebSocket class - exactly like the main app
  class ElevenLabsWebSocket {
    constructor(agentId, apiKey, onMessage, onConnectionChange, onError) {
      this.agentId = agentId;
      this.apiKey = apiKey;
      this.onMessage = onMessage;
      this.onConnectionChange = onConnectionChange;
      this.onError = onError;
      this.websocket = null;
      this.isMuted = false;
      this.audioContext = null;
      this.audioRecorder = null;
    }

    async connect() {
      try {
        console.log('🔌 Connecting to ElevenLabs WebSocket...');
        
        // Get signed URL
        const response = await fetch('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/get-elevenlabs-signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: this.agentId })
        });

        if (!response.ok) {
          throw new Error(\`Failed to get signed URL: \${response.status}\`);
        }

        const data = await response.json();
        const signedUrl = data.signed_url;

        this.websocket = new WebSocket(signedUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ Connected to ElevenLabs');
          this.onConnectionChange(true);
          this.startAudioRecording();
        };

        this.websocket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Received message:', data.type);
            
            this.onMessage({
              type: data.type,
              audio_event: data.audio_event,
              user_transcript: data.user_transcript,
              agent_response_text: data.agent_response_text
            });

            // Handle audio playback
            if (data.audio_event?.type === 'audio_stream' && data.audio_event.audio_base_64) {
              await this.playAudio(data.audio_event.audio_base_64);
            }
          } catch (error) {
            console.error('❌ Error processing message:', error);
          }
        };

        this.websocket.onclose = () => {
          console.log('🔌 Disconnected from ElevenLabs');
          this.onConnectionChange(false);
          this.stopAudioRecording();
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.onError('Connection error');
        };

      } catch (error) {
        console.error('❌ Failed to connect:', error);
        this.onError(error.message);
      }
    }

    disconnect() {
      if (this.websocket) {
        this.stopAudioRecording();
        this.websocket.close();
        this.websocket = null;
      }
    }

    async startAudioRecording() {
      try {
        if (!this.audioRecorder) {
          this.audioRecorder = new SimpleAudioRecorder((audioData) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN && !this.isMuted) {
              const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
              this.websocket.send(JSON.stringify({
                type: 'audio_stream',
                audio_base_64: base64Audio
              }));
            }
          });
        }
        await this.audioRecorder.start();
      } catch (error) {
        console.error('❌ Failed to start audio recording:', error);
      }
    }

    stopAudioRecording() {
      if (this.audioRecorder) {
        this.audioRecorder.stop();
        this.audioRecorder = null;
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
    }

    async playAudio(base64Audio) {
      try {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      } catch (error) {
        console.error('❌ Error playing audio:', error);
      }
    }
  }

  // SimpleAudioRecorder class - exactly like the main app
  class SimpleAudioRecorder {
    constructor(onAudioData) {
      this.onAudioData = onAudioData;
      this.stream = null;
      this.mediaRecorder = null;
      this.isRecording = false;
    }

    async start() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });

        this.mediaRecorder = new MediaRecorder(this.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                this.onAudioData(reader.result);
              }
            };
            reader.readAsArrayBuffer(event.data);
          }
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
      } catch (error) {
        console.error('❌ Error starting audio recording:', error);
        throw error;
      }
    }

    stop() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }

    isActive() {
      return this.isRecording;
    }
  }

  // Message handler - exactly like useGlobalConvaiState
  function handleMessage(message) {
    console.log('📨 Global message received:', message.type);
    state.messages.push(message);
    state.isSpeaking = message.type === 'agent_response' || message.type === 'agent_response_correction' 
      ? false 
      : message.audio_event ? true : state.isSpeaking;
    updateUI();
  }

  function handleConnectionChange(connected) {
    state.isConnected = connected;
    state.isSpeaking = false;
    updateUI();
  }

  function handleError(error) {
    console.error('❌ Widget error:', error);
    alert(\`Erro: \${error}\`);
  }

  // Update UI based on state - exactly like ThreeDotsEmbeddedConvai
  function updateUI() {
    const buttonsContainer = document.getElementById('threedotts-buttons');
    const container = document.getElementById('threedotts-container');
    if (!buttonsContainer || !container) return;
    
    if (!state.isConnected) {
      container.classList.remove('connected');
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
          <svg class="icon-phone" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Ligar
        </button>
      \`;
    } else {
      container.classList.add('connected');
      buttonsContainer.innerHTML = \`
        <div class="threedotts-controls animate-scale-in">
          <button class="threedotts-button danger" onclick="window.threedottsWidget.disconnect()">
            <svg class="icon-phone-off" viewBox="0 0 24 24">
              <path d="m10.68 13.31-2.22-2.22a16 16 0 0 1-2.4-5.63A2 2 0 0 1 8.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L12.09 10.9a16 16 0 0 1-1.41 2.41z"/>
              <path d="m16.46 12-1.27-1.27a2 2 0 0 1-.45-2.11 12.84 12.84 0 0 0 .7-2.81A2 2 0 0 1 17.39 4h3a2 2 0 0 1 2 1.72 19.79 19.79 0 0 1-.98 4.49z"/>
              <line x1="2" x2="22" y1="2" y2="22"/>
            </svg>
          </button>
          <button class="threedotts-button secondary \${state.isMuted ? 'danger' : ''}" onclick="window.threedottsWidget.toggleMute()">
            \${state.isMuted ? 
              \`<svg class="icon-mic-off" viewBox="0 0 24 24">
                <line x1="2" x2="22" y1="2" y2="22"/>
                <path d="m7 7-.78-.22a1.53 1.53 0 0 0-.12-.03A3 3 0 0 0 3 9v3a9 9 0 0 0 5.69 8.31A3 3 0 0 0 12 17v-6"/>
                <path d="M9 9v4a3 3 0 0 0 5.12 2.12L9 9z"/>
                <path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/>
              </svg>\` : 
              \`<svg class="icon-mic" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="23"/>
                <line x1="8" x2="16" y1="23" y2="23"/>
              </svg>\`}
          </button>
        </div>
      \`;
    }
  }

  // Global actions - exactly like useGlobalConvaiState
  let webSocketInstance = null;

  const actions = {
    handleConnect: async () => {
      try {
        const agentId = config.agentId || new URLSearchParams(window.location.search).get('agentId');
        
        if (!agentId) {
          alert('Agent ID não configurado. Configure usando: window.threedottsWidget.configure({ agentId: "YOUR_AGENT_ID" })');
          return;
        }

        if (!webSocketInstance) {
          webSocketInstance = new ElevenLabsWebSocket(
            agentId,
            '',
            handleMessage,
            handleConnectionChange,
            handleError
          );
        }
        await webSocketInstance.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
        handleError('Falha ao conectar');
      }
    },
    handleDisconnect: () => {
      if (webSocketInstance) {
        webSocketInstance.disconnect();
      }
    },
    toggleMute: () => {
      if (webSocketInstance) {
        const newMutedState = !state.isMuted;
        webSocketInstance.setMuted(newMutedState);
        state.isMuted = newMutedState;
        updateUI();
      }
    }
  };

  // Global API - exactly like the component interface
  window.threedottsWidget = {
    connect: actions.handleConnect,
    disconnect: actions.handleDisconnect,
    toggleMute: actions.toggleMute,
    configure: (options) => {
      console.log('🔧 Configuring widget with options:', options);
      Object.assign(config, options);
      console.log('✅ Widget configuration updated:', config);
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
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for debugging
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