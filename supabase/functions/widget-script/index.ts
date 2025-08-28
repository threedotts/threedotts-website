import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const widgetServe = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📦 Widget script requested');

    // Extract organizationId from query params if provided
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');
    
    let agentId: string;
    let voiceApiKey: string;
    
    // organizationId is required - no fallback defaults
    if (!organizationId) {
      console.error('❌ Organization ID is required');
      const errorScript = `
        console.error('❌ ThreeDotts Widget Error: Organization ID is required');
        console.error('Please add organizationId parameter to the script URL or configure via JavaScript');
        
        // Show error message on page
          (function() {
            const showError = (message) => {
              // Wait for DOM to be ready
              const display = () => {
                if (!document.body) {
                  setTimeout(display, 10);
                  return;
                }
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = \`
                  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                  background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                  padding: 12px; border-radius: 8px; max-width: 300px;
                  font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                \`;
                errorDiv.innerHTML = message;
                document.body.appendChild(errorDiv);
                
                // Auto-remove after 10 seconds
                setTimeout(() => errorDiv.remove(), 10000);
              };
              display();
            };
            
            showError(\`
              <strong>ThreeDotts Widget Error:</strong><br>
              Organization ID is required. Please check your embed code.
            \`);
          })();
      `;
      return new Response(errorScript, {
        status: 200, // Return 200 so the browser executes the JavaScript
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }
    
    console.log('🔍 Looking up config for organization:', organizationId);
    
    try {
      // Fetch organization agent config
      const { data: config, error } = await supabase
        .from('organization_agent_config')
        .select('primary_agent_id, api_key_secret_name')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('❌ Database error fetching org config:', error);
        const errorScript = `
          console.error('❌ ThreeDotts Widget Error: Database error fetching organization configuration');
          console.error('Error details:', ${JSON.stringify(error.message)});
          
          (function() {
            const showError = (message) => {
              // Wait for DOM to be ready
              const display = () => {
                if (!document.body) {
                  setTimeout(display, 10);
                  return;
                }
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = \`
                  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                  background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                  padding: 12px; border-radius: 8px; max-width: 300px;
                  font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                \`;
                errorDiv.innerHTML = message;
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 10000);
              };
              display();
            };
            
            showError(\`
              <strong>ThreeDotts Widget Error:</strong><br>
              Database connection failed. Please try again later.
            \`);
        `;
        return new Response(errorScript, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
        });
      }
      
      if (!config) {
        console.error('❌ No agent configuration found for organization:', organizationId);
        console.error('Please add agent configuration in the organization_agent_config table');
        const errorScript = `
          console.error('❌ ThreeDotts Widget Error: No agent configuration found for organization ${organizationId}');
          console.error('Please contact your administrator to configure the AI agent settings');
          
          (function() {
            const showError = (message) => {
              // Wait for DOM to be ready
              const display = () => {
                if (!document.body) {
                  setTimeout(display, 10);
                  return;
                }
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = \`
                  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                  background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                  padding: 12px; border-radius: 8px; max-width: 300px;
                  font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                \`;
                errorDiv.innerHTML = message;
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 15000);
              };
              display();
            };
            
            showError(\`
              <strong>ThreeDotts Widget:</strong><br>
              Agent not configured for this organization. Please contact your administrator.
            \`);
          })();
        `;
        return new Response(errorScript, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
        });
      }
      
      console.log('✅ Found org config:', config);
      agentId = config.primary_agent_id;
      
      // Try to get API key - first check if it's available as environment variable
      console.log('🔍 Trying to fetch API key:', config.api_key_secret_name);
      
      // Method 1: Try as environment variable first
      voiceApiKey = Deno.env.get(config.api_key_secret_name);
      
      if (voiceApiKey) {
        console.log('✅ Retrieved API key from environment variable');
      } else {
        console.log('⚠️ API key not found in environment, trying vault...');
        
        // Method 2: Try vault.read_secret
        try {
          const { data: secretData, error: secretError } = await supabase
            .rpc('vault.read_secret', { secret_name: config.api_key_secret_name });
            
          if (secretError) {
            console.error('❌ Vault error details:', secretError);
            console.error('❌ Error fetching secret from vault:', secretError);
            const errorScript = `
              console.error('❌ ThreeDotts Widget Error: Could not retrieve API key from secrets');
              console.error('Vault error:', ${JSON.stringify(secretError.message || 'Unknown vault error')});
              
              (function() {
                const showError = (message) => {
                  // Wait for DOM to be ready
                  const display = () => {
                    if (!document.body) {
                      setTimeout(display, 10);
                      return;
                    }
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = \`
                      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                      background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                      padding: 12px; border-radius: 8px; max-width: 300px;
                      font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    \`;
                    errorDiv.innerHTML = message;
                    document.body.appendChild(errorDiv);
                    setTimeout(() => errorDiv.remove(), 10000);
                  };
                  display();
                };
                
                showError(\`
                  <strong>ThreeDotts Widget:</strong><br>
                  API key configuration error. Please contact your administrator.
                \`);
              })();
            `;
            return new Response(errorScript, {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
            });
          }
          
          if (!secretData) {
            console.error('❌ No API key found in vault for:', config.api_key_secret_name);
            const errorScript = `
              console.error('❌ ThreeDotts Widget Error: API key not found in secrets');
              
              (function() {
                const showError = (message) => {
                  // Wait for DOM to be ready
                  const display = () => {
                    if (!document.body) {
                      setTimeout(display, 10);
                      return;
                    }
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = \`
                      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                      background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                      padding: 12px; border-radius: 8px; max-width: 300px;
                      font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    \`;
                    errorDiv.innerHTML = message;
                    document.body.appendChild(errorDiv);
                    setTimeout(() => errorDiv.remove(), 10000);
                  };
                  display();
                };
                
                showError(\`
                  <strong>ThreeDotts Widget:</strong><br>
                  API key not configured. Please contact your administrator.
                \`);
              })();
            `;
            return new Response(errorScript, {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
            });
          }
          
          voiceApiKey = secretData;
          console.log('✅ Retrieved API key from vault');
          
        } catch (secretError) {
          console.error('❌ Exception when fetching secret:', secretError);
          const errorScript = `
            console.error('❌ ThreeDotts Widget Error: Failed to retrieve API key');
            console.error('Exception:', ${JSON.stringify(secretError.message || 'Unknown error')});
            
            (function() {
              const showError = (message) => {
                // Wait for DOM to be ready
                const display = () => {
                  if (!document.body) {
                    setTimeout(display, 10);
                    return;
                  }
                  const errorDiv = document.createElement('div');
                  errorDiv.style.cssText = \`
                    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                    background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                    padding: 12px; border-radius: 8px; max-width: 300px;
                    font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  \`;
                  errorDiv.innerHTML = message;
                  document.body.appendChild(errorDiv);
                  setTimeout(() => errorDiv.remove(), 10000);
                };
                display();
              };
              
              showError(\`
                <strong>ThreeDotts Widget:</strong><br>
                Failed to retrieve API key. Please contact your administrator.
              \`);
            })();
          `;
          return new Response(errorScript, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
          });
        }
      }
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      const errorScript = `
        console.error('❌ ThreeDotts Widget Error: Database connection failed');
        
        (function() {
          const showError = (message) => {
            // Wait for DOM to be ready
            const display = () => {
              if (!document.body) {
                setTimeout(display, 10);
                return;
              }
              const errorDiv = document.createElement('div');
              errorDiv.style.cssText = \`
                position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                background: #fee2e2; border: 1px solid #fecaca; color: #dc2626;
                padding: 12px; border-radius: 8px; max-width: 300px;
                font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              \`;
              errorDiv.innerHTML = message;
              document.body.appendChild(errorDiv);
              setTimeout(() => errorDiv.remove(), 10000);
            };
            display();
          };
          
          showError(\`
            <strong>ThreeDotts Widget:</strong><br>
            Database connection failed. Please try again later.
          \`);
        })();
      `;
      return new Response(errorScript, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/javascript' }
      });
    }
    
    console.log('🎯 Using agent ID:', agentId);

    const widgetScript = `
(function() {
  'use strict';
  
  // Configuration - support both agentId and organizationId
  const config = {
    agentId: '${agentId}', // Pre-resolved from server
    organizationId: '${organizationId || ''}' // Store org ID if provided
  };

  // Widget state - exactly like useGlobalConvaiState
  const state = {
    isExpanded: false,
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    isSpeaking: false,
    message: '',
    messages: [],
    websocket: null,
    audioRecorder: null,
    audioPlayer: null,
    hasAnimated: false
  };

  // Inject CSS styles - EXACTLY like ThreeDotsEmbeddedConvai (same colors!)
  function injectStyles() {
    const styles = \`
      #threedotts-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .threedotts-container {
        background: hsla(0, 0%, 100%, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid hsl(175, 30%, 91%);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 9999px;
        padding: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        width: fit-content;
      }
      
      .threedotts-container.connected {
        border-color: hsla(175, 85%, 35%, 0.3);
        box-shadow: 0 10px 15px -3px hsla(175, 85%, 35%, 0.2), 0 4px 6px -2px hsla(175, 85%, 35%, 0.1);
      }
      
      .threedotts-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(175, 30%, 96%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .threedotts-avatar-inner {
        width: 100%;
        height: 100%;
        background: hsla(170, 20%, 50%, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .threedotts-avatar svg {
        width: 24px;
        height: 24px;
        color: hsl(170, 20%, 50%);
        fill: currentColor;
      }
      
      .threedotts-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
        border-radius: 9999px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        border: none;
        outline: none;
        position: relative;
        background: linear-gradient(135deg, hsl(175, 85%, 35%), hsl(165, 90%, 40%));
        color: hsl(0, 0%, 100%);
        box-shadow: 0 10px 30px -10px hsla(175, 85%, 35%, 0.3);
        height: 40px;
        padding: 0 16px;
        transform: scale(1);
      }
      
      .threedotts-button svg {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        flex-shrink: 0;
      }
      
      .threedotts-button:hover {
        opacity: 0.9;
        transform: scale(1.05);
        box-shadow: 0 0 40px hsla(175, 75%, 45%, 0.4);
      }
      
      .threedotts-button:focus {
        outline: 2px solid hsl(175, 85%, 35%);
        outline-offset: 2px;
      }
      
      .threedotts-button.secondary svg,
      .threedotts-button.danger svg {
        width: 18px;
        height: 18px;
        margin: 0;
        flex-shrink: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      
      .threedotts-button.secondary {
        background: hsl(175, 30%, 96%);
        color: hsl(160, 100%, 8%);
        width: 40px;
        height: 40px;
        padding: 0;
        box-shadow: none;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      
      .threedotts-button.secondary:hover {
        background: hsl(175, 30%, 91%);
        transform: scale(1.05);
      }
      
      .threedotts-button.danger {
        background: hsl(0, 84%, 60%);
        color: hsl(0, 0%, 100%);
        width: 40px;
        height: 40px;
        padding: 0;
        box-shadow: none;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      
      .threedotts-button.danger:hover {
        background: hsl(0, 84%, 55%);
        transform: scale(1.05);
      }
      
      .threedotts-button.connecting {
        background: hsl(0, 0%, 94%);
        color: hsl(0, 0%, 60%);
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 400;
        cursor: default;
        box-shadow: none;
      }
      
      .threedotts-button.connecting:hover {
        transform: none;
        opacity: 1;
      }
      
      .threedotts-controls {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      
      .threedotts-powered {
        font-size: 10px;
        color: hsl(170, 20%, 50%);
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
      .icon-phone,
      .icon-phone-off,
      .icon-mic,
      .icon-mic-off {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin: 0;
      }
      
      .icon-phone {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      
      .icon-phone-off,
      .icon-mic,
      .icon-mic-off {
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
          <svg class="icon-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  // AudioRecorder class - EXACTLY like VoiceWebSocket.ts
  class AudioRecorder {
    constructor(onAudioData, onMuteChange) {
      this.onAudioData = onAudioData;
      this.onMuteChange = onMuteChange;
      this.stream = null;
      this.audioContext = null;
      this.processor = null;
      this.source = null;
      this.isRecording = false;
      this.isMuted = false;
    }

    async start() {
      if (this.isRecording) return;

      try {
        console.log('Starting audio recording...');
        
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        // Let AudioContext use the stream's native sample rate to avoid mismatch
        this.audioContext = new AudioContext();
        
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
        
        console.log('AudioContext sample rate:', this.audioContext.sampleRate);
        console.log('Stream sample rate:', this.stream.getAudioTracks()[0].getSettings().sampleRate);
        
        this.processor.onaudioprocess = (e) => {
          if (!this.isRecording) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Resample to 16kHz if necessary
          let processedData = inputData;
          const currentSampleRate = this.audioContext.sampleRate;
          const targetSampleRate = 16000;
          
          if (currentSampleRate !== targetSampleRate) {
            // Simple downsampling - take every nth sample
            const ratio = currentSampleRate / targetSampleRate;
            const newLength = Math.floor(inputData.length / ratio);
            processedData = new Float32Array(newLength);
            
            for (let i = 0; i < newLength; i++) {
              const sourceIndex = Math.floor(i * ratio);
              processedData[i] = inputData[sourceIndex];
            }
          }
          
          // Convert Float32Array to 16-bit PCM
          const pcmData = new Int16Array(processedData.length);
          for (let i = 0; i < processedData.length; i++) {
            const s = Math.max(-1, Math.min(1, processedData[i]));
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

    setMuted(muted) {
      this.isMuted = muted;
      console.log(muted ? '🔇 Microphone muted' : '🎤 Microphone unmuted');
      if (this.onMuteChange) {
        this.onMuteChange(muted);
      }
    }

    isMicMuted() {
      return this.isMuted;
    }
  }

  // AudioPlayer class - EXACTLY like VoiceWebSocket.ts
  class AudioPlayer {
    constructor() {
      this.audioContext = null; // Initialize as null
      this.audioQueue = [];
      this.isPlaying = false;
    }

    async initAudioContext() {
      if (!this.audioContext) {
        this.audioContext = new AudioContext({
          sampleRate: 16000
        });
        
        // Resume audio context if suspended (required for user interaction)
        if (this.audioContext.state === 'suspended') {
          console.log('🔊 Resuming audio context...');
          await this.audioContext.resume();
        }
      }
    }

    async addAudioChunk(audioData) {
      await this.initAudioContext(); // Ensure audio context is ready
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
      const audioData = this.audioQueue.shift();

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
        console.log('🔊 Playing audio chunk');
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

  // VoiceWebSocket class - DIRECT CONNECTION like main app
  class VoiceWebSocket {
    constructor(agentId, apiKey, onMessage, onConnectionChange, onError) {
      this.agentId = agentId;
      this.apiKey = apiKey;
      this.onMessage = onMessage;
      this.onConnectionChange = onConnectionChange;
      this.onError = onError;
      this.ws = null;
      this.audioRecorder = null;
      this.audioPlayer = null;
      this.isConnected = false;
      this.isMuted = false;
    }

    async connect() {
      if (this.isConnected) {
        console.log('Already connected');
        return;
      }

      try {
        console.log('🚀 Connecting to Voice AI...');
        console.log('Agent ID:', this.agentId);
        
        // Initialize audio components
        this.audioPlayer = new AudioPlayer();
        await this.audioPlayer.initAudioContext(); // Initialize audio context with user interaction
        this.audioRecorder = new AudioRecorder((audioData) => {
          this.sendAudioChunk(audioData);
        });

        // Connect DIRECTLY using the US endpoint
        const wsUrl = \`wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=\${this.agentId}\`;
        console.log('🔗 Connecting to:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket opened, sending conversation initiation...');
          
          // Send conversation initiation as per documentation
          this.send({
            type: "conversation_initiation_client_data"
          });
        };

        this.ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Received:', message.type);
            
            // Handle connection confirmation
            if (message.type === 'conversation_initiation_metadata' && !this.isConnected) {
              console.log('✅ Conversation initiated successfully');
              this.isConnected = true;
              this.onConnectionChange(true);
              
              // Auto-start recording when connection is established
              await this.startRecording();
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
        this.onError(\`Connection failed: \${error}\`);
      }
    }

    handleMessage(message) {
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
          
        case 'client_tool_call':
          console.log('🔧 Client tool call received:', message);
          this.handleClientToolCall(message);
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
          if (this.audioPlayer) {
            this.audioPlayer.stop();
            this.audioPlayer = new AudioPlayer();
          }
          break;
      }
    }

    handleClientToolCall(message) {
      console.log('🛠️ Processing client tool call:', message);
      
      try {
        const toolCall = message.client_tool_call;
        if (!toolCall) {
          console.error('❌ No client_tool_call in message:', message);
          return;
        }
        
        const { tool_call_id, tool_name, parameters } = toolCall;
        console.log('🔧 Executing tool: ' + tool_name + ' with params:', parameters);
        
        // Execute the tool and get result
        let result = this.executeClientTool(tool_name, parameters);
        
        // Send response back to agent
        this.send({
          type: "client_tool_result",
          tool_call_id: tool_call_id,
          result: result || "Tool executed successfully"
        });
        
        console.log('✅ Tool ' + tool_name + ' executed, result sent back');
        
      } catch (error) {
        console.error('❌ Error handling client tool call:', error);
        
        // Send error response back to agent
        if (message.client_tool_call?.tool_call_id) {
          this.send({
            type: "client_tool_result", 
            tool_call_id: message.client_tool_call.tool_call_id,
            result: "Error: " + error.message
          });
        }
      }
    }
    
    executeClientTool(toolName, parameters) {
      console.log('🔨 Executing client tool: ' + toolName);
      
      // First try to find the tool directly on the window object
      if (typeof window[toolName] === 'function') {
        console.log('✅ Found tool function on window: ' + toolName);
        return window[toolName](parameters);
      }
      
      // Fallback: Get configured client tools
      const clientTools = this.getClientTools();
      
      if (clientTools && typeof clientTools[toolName] === 'function') {
        console.log('✅ Found tool function in clientTools: ' + toolName);
        return clientTools[toolName](parameters);
      }
      
      // Tool not found anywhere
      console.warn('⚠️ Tool not found: ' + toolName + '. Please define this tool on window object or in window.threedottsWidget.clientTools');
      return 'Tool "' + toolName + '" not found. Define it on window object to use it.';
    }
    
    getClientTools() {
      // Check if client tools are configured globally
      if (window.threedottsWidget && window.threedottsWidget.clientTools) {
        return window.threedottsWidget.clientTools;
      }
      return null;
    }

    send(message) {
      console.log('🔍 WebSocket state check - readyState:', this.ws?.readyState, 'isConnected:', this.isConnected);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('📤 Sending:', message.type, JSON.stringify(message));
        this.ws.send(JSON.stringify(message));
      } else {
        console.warn('⚠️ WebSocket not ready, cannot send:', message.type, 'readyState:', this.ws?.readyState);
      }
    }

    sendAudioChunk(audioData) {
      // Check if WebSocket is closing or closed
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        if (this.ws && this.ws.readyState === WebSocket.CLOSING) {
          console.log('🛑 WebSocket is closing, stopping audio recording...');
          this.isConnected = false;
          if (this.audioRecorder) {
            this.audioRecorder.stop();
          }
        }
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
        console.log('📢 Sent user_activity event to interrupt agent');
        
        await this.audioRecorder.start();
      }
    }

    stopRecording() {
      if (this.audioRecorder) {
        this.audioRecorder.stop();
      }
    }

    setMuted(muted) {
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

  // Update UI based on state - exactly like ThreeDotsEmbeddedConvai
  function updateUI() {
    const buttonsContainer = document.getElementById('threedotts-buttons');
    const container = document.getElementById('threedotts-container');
    if (!buttonsContainer || !container) return;
    
    if (!state.isConnected && !state.isConnecting) {
      container.classList.remove('connected');
      state.hasAnimated = false; // Reset animation flag when disconnected
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button" onclick="window.threedottsWidget.connect()">
          <svg class="icon-phone" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Ligar
        </button>
      \`;
    } else if (state.isConnecting) {
      container.classList.remove('connected');
      buttonsContainer.innerHTML = \`
        <button class="threedotts-button connecting">
          Conectando...
        </button>
      \`;
    } else {
      container.classList.add('connected');
      
      // Only animate once when first connecting
      const animateClass = !state.hasAnimated ? 'animate-scale-in' : '';
      if (!state.hasAnimated) {
        state.hasAnimated = true;
      }
      
      buttonsContainer.innerHTML = \`
        <div class="threedotts-controls \${animateClass}">
          <button class="threedotts-button danger" onclick="window.threedottsWidget.disconnect()">
            <svg class="icon-phone-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6z"/>
              <path d="M16.5 8.5L22 3"/>
              <path d="M22 8.5l-5.5-5.5"/>
            </svg>
          </button>
          <button class="threedotts-button secondary \${state.isMuted ? 'danger' : ''}" onclick="window.threedottsWidget.toggleMute()">
            \${state.isMuted ? 
              \`<svg class="icon-mic-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="2" x2="22" y1="2" y2="22"/>
                <path d="m7 7-.78-.22a1.53 1.53 0 0 0-.12-.03A3 3 0 0 0 3 9v3a9 9 0 0 0 5.69 8.31A3 3 0 0 0 12 17v-6"/>
                <path d="M9 9v4a3 3 0 0 0 5.12 2.12L9 9z"/>
                <path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/>
              </svg>\` : 
              \`<svg class="icon-mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  // Message handler - exactly like useGlobalConvaiState
  function handleMessage(message) {
    console.log('📨 Global message received:', message.type);
    state.messages.push(message);
    
    // Only update UI for messages that change the speaking state
    const oldSpeaking = state.isSpeaking;
    state.isSpeaking = message.type === 'agent_response' || message.type === 'agent_response_correction' 
      ? false 
      : message.audio_event ? true : state.isSpeaking;
    
    // Only call updateUI if speaking state actually changed
    if (oldSpeaking !== state.isSpeaking) {
      updateUI();
    }
  }

  function handleConnectionChange(connected) {
    state.isConnected = connected;
    state.isConnecting = false;
    state.isSpeaking = false;
    updateUI();
  }

  function handleError(error) {
    console.error('❌ Widget error:', error);
    alert(\`Erro: \${error}\`);
  }
  
  // Global actions - exactly like useGlobalConvaiState
  let webSocketInstance = null;

  const actions = {
    handleConnect: async () => {
      try {
        // Use the pre-resolved agent ID from server configuration
        const agentId = config.agentId;
        
        if (!agentId) {
          alert('Agent ID não configurado. Verifique a configuração da organização.');
          return;
        }

        console.log('🔧 Connecting with agent ID:', agentId);
        console.log('🏢 Organization ID:', config.organizationId || 'not provided');

        // Show connecting state
        state.isConnecting = true;
        updateUI();

        if (!webSocketInstance) {
          webSocketInstance = new VoiceWebSocket(
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
        state.isConnecting = false;
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

  // Global API - now supports both agentId and organizationId configuration
  window.threedottsWidget = {
    connect: actions.handleConnect,
    disconnect: actions.handleDisconnect,
    toggleMute: actions.toggleMute,
    configure: (options) => {
      console.log('🔧 Configuring widget with options:', options);
      
      // Support both agentId (direct) and organizationId (server-resolved)
      if (options.agentId) {
        config.agentId = options.agentId;
        console.log('✅ Agent ID configured:', config.agentId);
      }
      
      if (options.organizationId) {
        config.organizationId = options.organizationId;
        console.log('✅ Organization ID configured:', config.organizationId);
        console.log('ℹ️ Agent ID was pre-resolved on server:', config.agentId);
      }
      
      console.log('✅ Widget configuration updated:', config);
    }
  };

  // Load Comfortaa font and initialize widget
  function loadComfortaaAndInit() {
    // Create Google Fonts link element instead of trying to load specific woff2 file
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap';
    
    // Add font to head
    document.head.appendChild(fontLink);
    
    // Wait a bit for font to load, then initialize
    setTimeout(() => {
      console.log('✅ Comfortaa font loaded via Google Fonts');
      injectStyles();
      createWidget();
      updateUI();
    }, 100);
  }

  // Initialize widget
  function initWidget() {
    loadComfortaaAndInit();
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

Deno.serve(widgetServe);