export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;

  constructor(private onAudioData: (audioData: ArrayBuffer) => void) {}

  async start() {
    if (this.isRecording) return;

    try {
      console.log('Starting audio recording...');
      
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
        
        this.onAudioData(pcmData.buffer);
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
      
      console.log('Audio recording started successfully');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop() {
    console.log('Stopping audio recording...');
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
      console.error('Error playing audio:', error);
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
      console.log('Already connected');
      return;
    }

    try {
      console.log('🚀 Connecting to ElevenLabs Conversational AI...');
      console.log('Agent ID:', this.agentId);
      
      // Initialize audio components
      this.audioPlayer = new AudioPlayer();
      this.audioRecorder = new AudioRecorder((audioData) => {
        this.sendAudioChunk(audioData);
      });

      // Connect using the US endpoint (allowed by CSP)
      const wsUrl = `wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
      console.log('🔗 Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket opened, sending conversation initiation...');
        
        // Send conversation initiation as per documentation
        // For public agents, no API key is needed
        this.send({
          type: "conversation_initiation_client_data"
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Received:', message.type);
          
          // Handle connection confirmation
          if (message.type === 'conversation_initiation_metadata' && !this.isConnected) {
            console.log('✅ Conversation initiated successfully');
            this.isConnected = true;
            this.onConnectionChange(true);
          }
          
          this.handleMessage(message);
          this.onMessage(message);
        } catch (error) {
          console.error('❌ Error parsing message:', error, event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.onConnectionChange(false);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.onError('WebSocket connection failed');
      };

    } catch (error) {
      console.error('❌ Connection error:', error);
      this.onError(`Connection failed: ${error}`);
    }
  }

  private handleMessage(message: ElevenLabsMessage) {
    console.log('🔄 Handling message:', message.type);
    
    switch (message.type) {
      case 'conversation_initiation_metadata':
        console.log('✅ Conversation metadata:', message);
        break;
        
      case 'user_transcript':
        if (message.user_transcription_event?.user_transcript) {
          console.log('📝 User said:', message.user_transcription_event.user_transcript);
        }
        break;
        
      case 'agent_response':
        if (message.agent_response_event?.agent_response) {
          console.log('🤖 Agent response:', message.agent_response_event.agent_response);
        }
        break;
        
      case 'audio':
        if (message.audio_event?.audio_base_64 && this.audioPlayer) {
          console.log('🎵 Playing audio chunk');
          try {
            // Convert base64 to ArrayBuffer
            const binaryString = atob(message.audio_event.audio_base_64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.audioPlayer.addAudioChunk(bytes.buffer);
          } catch (error) {
            console.error('❌ Error processing audio:', error);
          }
        }
        break;
        
      case 'interruption':
        console.log('🛑 Conversation interrupted:', message.interruption_event?.reason);
        break;
        
      case 'ping':
        console.log('🏓 Ping received, sending pong');
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
        console.log('❓ Unhandled message type:', message.type, message);
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
}