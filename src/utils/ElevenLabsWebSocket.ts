export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private isMuted = false; // New: track mute state

  constructor(private onAudioData: (audioData: ArrayBuffer) => void, private onMuteChange?: (muted: boolean) => void) {}

  async start() {
    if (this.isRecording) return;

    try {
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // ElevenLabs expects 16kHz
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Only send audio data if not muted
        if (!this.isMuted) {
          this.onAudioData(pcmData.buffer);
        }
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
      
      // Audio recording started successfully
    } catch (error) {
      throw error;
    }
  }

  stop() {
    this.isRecording = false;
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  isActive() {
    return this.isRecording;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.onMuteChange) {
      this.onMuteChange(muted);
    }
  }

  isMicMuted() {
    return this.isMuted;
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;

  constructor() {
    this.audioContext = new AudioContext({
      sampleRate: 16000
    });
  }

  async addAudioChunk(audioData: ArrayBuffer) {
    this.audioQueue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      // Convert PCM data to AudioBuffer
      const pcmData = new Int16Array(audioData);
      const audioBuffer = this.audioContext.createBuffer(1, pcmData.length, 16000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 0x8000;
      }
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      this.playNext(); // Continue with next chunk
    }
  }

  stop() {
    this.audioQueue = [];
    this.isPlaying = false;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export interface ElevenLabsMessage {
  type: string;
  // Conversation initiation
  conversation_initiation_metadata?: any;
  
  // User transcript
  user_transcription_event?: {
    user_transcript: string;
  };
  
  // Agent response
  agent_response_event?: {
    agent_response: string;
  };
  
  // Audio response
  audio_event?: {
    audio_base_64: string;
    event_id: number;
  };
  
  // Interruption
  interruption_event?: {
    reason: string;
  };
  
  // Ping/Pong
  ping_event?: {
    event_id: number;
    ping_ms?: number;
  };
  
  // Legacy fields for backward compatibility
  [key: string]: any;
}

export class ElevenLabsWebSocket {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private isConnected = false;
  private isMuted = false; // New: track mute state
  private agentId: string;

  constructor(
    agentId: string,
    apiKey: string, // Not used for public agents
    private onMessage: (message: ElevenLabsMessage) => void,
    private onConnectionChange: (connected: boolean) => void,
    private onError: (error: string) => void
  ) {
    this.agentId = agentId;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      
      // Initialize audio components
      this.audioPlayer = new AudioPlayer();
      this.audioRecorder = new AudioRecorder((audioData) => {
        this.sendAudioChunk(audioData);
      });

      // Connect using the US endpoint (allowed by CSP)
      const wsUrl = `wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        
        // Send conversation initiation as per documentation
        // For public agents, no API key is needed
        this.send({
          type: "conversation_initiation_client_data"
        });
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle connection confirmation
          if (message.type === 'conversation_initiation_metadata' && !this.isConnected) {
            this.isConnected = true;
            this.onConnectionChange(true);
            
            // Auto-start recording when connection is established
            await this.startRecording();
          }
          
          this.handleMessage(message);
          this.onMessage(message);
        } catch (error) {
          // Error handled silently
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.onConnectionChange(false);
      };

      this.ws.onerror = (error) => {
        this.onError('WebSocket connection failed');
      };

    } catch (error) {
      this.onError(`Connection failed: ${error}`);
    }
  }

  private handleMessage(message: ElevenLabsMessage) {
    
    switch (message.type) {
      case 'conversation_initiation_metadata':
        break;
        
      case 'user_transcript':
        if (message.user_transcription_event?.user_transcript) {
          // User transcript processed silently
        }
        break;
        
      case 'agent_response':
        if (message.agent_response_event?.agent_response) {
          // Agent response processed silently
        }
        break;
        
      case 'audio':
        if (message.audio_event?.audio_base_64 && this.audioPlayer) {
          try {
            // Convert base64 to ArrayBuffer
            const binaryString = atob(message.audio_event.audio_base_64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.audioPlayer.addAudioChunk(bytes.buffer);
          } catch (error) {
            // Error handled silently
          }
        }
        break;
        
      case 'interruption':
        // Stop current audio playback when interrupted
        if (this.audioPlayer) {
          this.audioPlayer.stop();
          this.audioPlayer = new AudioPlayer(); // Reinitialize for new audio
        }
        break;
        
      case 'agent_response_correction':
        if (message.agent_response_correction_event) {
          // Agent response corrected silently
        }
        break;
        
      case 'client_tool_call':
        if (message.client_tool_call) {
          this.handleClientToolCall(message.client_tool_call);
        }
        break;
        
      case 'ping':
        const pingEvent = message.ping_event;
        if (pingEvent) {
          // Send pong response as per documentation
          const delay = pingEvent.ping_ms || 0;
          setTimeout(() => {
            this.send({
              type: "pong",
              event_id: pingEvent.event_id,
            });
          }, delay);
        }
        break;
        
      default:
        // Unhandled message type
    }
    }
  }

  private handleClientToolCall(toolCall: any) {
    
    try {
      let result = '';
      
      // Execute specific client tools
      switch (toolCall.tool_name) {
        case 'redirectToExternalURL':
          const url = toolCall.parameters?.url;
          if (url) {
            // Perform the actual redirect
            if (url.startsWith('http')) {
              window.open(url, '_blank');
              result = `Opened ${url} in new tab`;
            } else {
              window.location.href = url;
              result = `Redirected to ${url}`;
            }
          } else {
            throw new Error('URL parameter is required');
          }
          break;
          
        default:
          result = `Tool ${toolCall.tool_name} executed successfully`;
          // Unknown tool, but acknowledged
      }
      }
      
      this.send({
        type: "client_tool_response",
        tool_call_id: toolCall.tool_call_id,
        result: result
      });
      
      console.log('✅ Client tool response sent:', result);
    } catch (error) {
      console.error('❌ Error executing client tool:', error);
      
      this.send({
        type: "client_tool_response",
        tool_call_id: toolCall.tool_call_id,
        error: `Error executing tool: ${error}`
      });
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending:', message.type);
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not ready, cannot send:', message.type);
    }
  }

  private sendAudioChunk(audioData: ArrayBuffer) {
    if (!this.isConnected) return;
    
    // Convert ArrayBuffer to base64 as required by the API
    const uint8Array = new Uint8Array(audioData);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binaryString);
    
    // Send using the correct message format from documentation
    this.send({
      user_audio_chunk: base64Audio
    });
  }

  async startRecording() {
    if (this.audioRecorder && !this.audioRecorder.isActive()) {
      // Send user_activity event to interrupt agent speech
      this.send({
        type: "user_activity"
      });
      console.log('📢 Sent user_activity event to interrupt agent');
      
      await this.audioRecorder.start();
    }
  }

  stopRecording() {
    if (this.audioRecorder) {
      this.audioRecorder.stop();
    }
  }

  sendTextMessage(text: string) {
    // Send contextual update as per documentation
    this.send({
      type: "contextual_update",
      text: text
    });
  }

  disconnect() {
    console.log('🔌 Disconnecting...');
    
    if (this.audioRecorder) {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }
    
    if (this.audioPlayer) {
      this.audioPlayer.stop();
      this.audioPlayer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.onConnectionChange(false);
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioRecorder) {
      this.audioRecorder.setMuted(muted);
    }
    
    if (!muted) {
      // Send user_activity when unmuting to interrupt agent if speaking
      this.send({
        type: "user_activity"
      });
      console.log('📢 Sent user_activity event on unmute');
    }
  }

  getMuteStatus() {
    return this.isMuted;
  }
}