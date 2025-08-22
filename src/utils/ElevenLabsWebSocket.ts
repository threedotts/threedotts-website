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
  [key: string]: any;
}

export class ElevenLabsWebSocket {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private isConnected = false;
  private agentId: string;
  private apiKey: string;

  constructor(
    agentId: string,
    apiKey: string,
    private onMessage: (message: ElevenLabsMessage) => void,
    private onConnectionChange: (connected: boolean) => void,
    private onError: (error: string) => void
  ) {
    this.agentId = agentId;
    this.apiKey = apiKey;
  }

  async connect() {
    if (this.isConnected) {
      console.log('Already connected');
      return;
    }

    try {
      console.log('Connecting to ElevenLabs WebSocket via Edge Function...');
      
      // Initialize audio components
      this.audioPlayer = new AudioPlayer();
      this.audioRecorder = new AudioRecorder((audioData) => {
        this.sendAudioChunk(audioData);
      });

      // Connect to our Supabase Edge Function WebSocket proxy
      const wsUrl = `wss://dkqzzypemdewomxrjftv.functions.supabase.co/elevenlabs-websocket?agent_id=${this.agentId}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to Edge Function proxy');
        this.isConnected = true;
        this.onConnectionChange(true);
        
        // The Edge Function will handle authentication automatically
        console.log('WebSocket proxy connection established');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type, message);
          
          this.handleMessage(message);
          this.onMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.onConnectionChange(false);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('Connection error occurred');
      };

    } catch (error) {
      console.error('Error connecting to ElevenLabs:', error);
      this.onError(`Connection failed: ${error}`);
    }
  }

  private handleMessage(message: ElevenLabsMessage) {
    console.log('Handling message type:', message.type);
    
    switch (message.type) {
      case 'connection_ready':
        console.log('✅ Connection ready:', message.message);
        break;
        
      case 'conversation_initiation_metadata':
        console.log('✅ Conversation initiated successfully');
        break;
        
      case 'audio_response':
        console.log('🎵 Received audio response');
        if (message.audio_response && this.audioPlayer) {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(message.audio_response);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          this.audioPlayer.addAudioChunk(bytes.buffer);
        }
        break;
        
      case 'user_transcript':
        console.log('📝 User transcript:', message.user_transcript);
        break;
        
      case 'agent_response':
        console.log('🤖 Agent response:', message.agent_response);
        break;
        
      case 'ping':
        console.log('🏓 Received ping, sending pong');
        // Respond to ping with pong
        this.send({
          type: 'pong',
          event_id: message.event_id
        });
        break;
        
      default:
        console.log('❓ Unhandled message type:', message.type, message);
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendAudioChunk(audioData: ArrayBuffer) {
    if (!this.isConnected) return;
    
    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(audioData);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binaryString);
    
    this.send({
      type: 'user_audio_chunk',
      chunk: base64Audio
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
    this.send({
      type: 'user_message',
      message: text
    });
  }

  disconnect() {
    console.log('Disconnecting from ElevenLabs...');
    
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