// ElevenLabs Demo utilities - same logic as the widget
import { supabase } from "@/integrations/supabase/client";

// AudioRecorder class - exactly like the widget
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isMuted: boolean = false;
  private onAudioData: (audioData: ArrayBuffer) => void;

  constructor(onAudioData: (audioData: ArrayBuffer) => void) {
    this.onAudioData = onAudioData;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
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
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isMuted) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM16)
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          this.onAudioData(int16Data.buffer);
        }
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      throw error;
    }
  }

  stop() {
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
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  isActive() {
    return this.stream !== null;
  }
}

// AudioPlayer class - exactly like the widget
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying: boolean = false;

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: 16000
      });
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  async addAudioChunk(audioData: ArrayBuffer) {
    await this.initAudioContext();
    this.audioQueue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  async playNext() {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      // Resume audio context if needed
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

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

// VoiceWebSocket class - exactly like the widget
export class VoiceWebSocket {
  private agentId: string;
  private apiKey: string;
  private onMessage: (message: any) => void;
  private onConnectionChange: (connected: boolean) => void;
  private onError: (error: string) => void;
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private isConnected: boolean = false;
  private isMuted: boolean = false;

  constructor(
    agentId: string, 
    apiKey: string, 
    onMessage: (message: any) => void, 
    onConnectionChange: (connected: boolean) => void, 
    onError: (error: string) => void
  ) {
    this.agentId = agentId;
    this.apiKey = apiKey;
    this.onMessage = onMessage;
    this.onConnectionChange = onConnectionChange;
    this.onError = onError;
  }

  async connect() {
    if (this.isConnected) {
      return;
    }
    
    try {
      // Initialize audio components
      this.audioPlayer = new AudioPlayer();
      await this.audioPlayer.initAudioContext();
      this.audioRecorder = new AudioRecorder((audioData) => {
        this.sendAudioChunk(audioData);
      });

      // Connect DIRECTLY to ElevenLabs like the widget
      const wsUrl = `wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        
        // Send conversation initiation with API key
        this.send({
          type: "conversation_initiation_client_data",
          client_secret: this.apiKey
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
  
  private handleMessage(message: any) {
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
          }
        }
        break;
        
      case 'interruption':
        if (this.audioPlayer) {
          this.audioPlayer.stop();
          this.audioPlayer = new AudioPlayer();
        }
        break;
    }
  }
  
  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // WebSocket not ready, cannot send message
    }
  }

  private sendAudioChunk(audioData: ArrayBuffer) {
    // Check if WebSocket is closing or closed
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Convert ArrayBuffer to base64 as required by the API
    const uint8Array = new Uint8Array(audioData);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binaryString);
    
    // Send using the correct message format from documentation
    this.send({
      type: "user_audio_chunk",
      user_audio_chunk: base64Audio
    });
  }

  async startRecording() {
    if (this.audioRecorder && !this.audioRecorder.isActive()) {
      // Send user_activity event to interrupt agent speech
      this.send({
        type: "user_activity"
      });
      
      await this.audioRecorder.start();
    }
  }

  stopRecording() {
    if (this.audioRecorder) {
      this.audioRecorder.stop();
    }
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
    }
  }
  
  disconnect() {
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

// Helper function to get agent config from server
export async function getAgentConfig(organizationId: string) {
  const { data, error } = await supabase.functions.invoke('get-agent-config', {
    body: { organizationId }
  });

  if (error) {
    throw new Error(`Failed to get agent config: ${error.message}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    agentId: data.agentId,
    apiKey: data.apiKey
  };
}