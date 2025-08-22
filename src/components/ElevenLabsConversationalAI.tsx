import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConversationMessage {
  type: string;
  user_message?: string;
  agent_response?: string;
  audio_event?: {
    type: string;
    audio_base_64?: string;
  };
  conversation_id?: string;
  user_transcript?: {
    text: string;
    is_final: boolean;
  };
  agent_response_text?: {
    text: string;
    is_final: boolean;
  };
}

interface AudioRecorder {
  start: () => Promise<void>;
  stop: () => void;
  isActive: () => boolean;
}

class SimpleAudioRecorder implements AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isRecording = false;

  constructor(private onAudioData: (audioData: ArrayBuffer) => void) {}

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

      this.mediaRecorder.start(1000); // Capture every second
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting audio recording:', error);
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

export const ElevenLabsConversationalAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const playAudioData = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsAgentSpeaking(false);
      };
      
      setIsAgentSpeaking(true);
      source.start(0);
      
      addMessage('🔊 Reproduzindo resposta do agente');
    } catch (error) {
      console.error('Error playing audio:', error);
      addMessage(`❌ Erro ao reproduzir áudio: ${error.message}`);
    }
  };

  const connectToAgent = async () => {
    if (!agentId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um Agent ID válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addMessage('🔌 Conectando ao agente conversacional...');

    try {
      // Get signed URL from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('get-elevenlabs-signed-url', {
        body: { agent_id: agentId }
      });

      if (error) {
        throw new Error(error.message);
      }

      const signedUrl = data.signed_url;
      console.log('Connecting to ElevenLabs WebSocket:', signedUrl);

      const ws = new WebSocket(signedUrl);

      ws.onopen = () => {
        console.log('✅ Connected to ElevenLabs Conversational AI');
        addMessage('✅ Conectado ao agente conversacional');
        setIsConnected(true);
        setIsLoading(false);
        wsRef.current = ws;
        
        toast({
          title: "Sucesso",
          description: "Conectado ao agente conversacional!",
        });
      };

      ws.onmessage = async (event) => {
        try {
          const data: ConversationMessage = JSON.parse(event.data);
          console.log('📨 Message received:', data);

          if (data.conversation_id && !conversationId) {
            setConversationId(data.conversation_id);
            addMessage(`🆔 Conversa iniciada: ${data.conversation_id}`);
          }

          if (data.user_transcript) {
            const { text, is_final } = data.user_transcript;
            if (is_final) {
              addMessage(`👤 Você: ${text}`);
            } else {
              addMessage(`👤 Você (parcial): ${text}`);
            }
          }

          if (data.agent_response_text) {
            const { text, is_final } = data.agent_response_text;
            if (is_final) {
              addMessage(`🤖 Agente: ${text}`);
            } else {
              addMessage(`🤖 Agente (parcial): ${text}`);
            }
          }

          if (data.audio_event?.type === 'audio_stream' && data.audio_event.audio_base_64) {
            await playAudioData(data.audio_event.audio_base_64);
          }

          if (data.type === 'conversation_end') {
            addMessage('🏁 Conversa finalizada');
            setIsConnected(false);
          }

        } catch (error) {
          console.error('❌ Error processing message:', error);
          addMessage(`❌ Erro ao processar mensagem: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        addMessage('❌ Erro na conexão WebSocket');
        setIsLoading(false);
        toast({
          title: "Erro de Conexão",
          description: "Erro na conexão com o agente",
          variant: "destructive",
        });
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        addMessage(`🔌 Conexão fechada (${event.code}: ${event.reason})`);
        setIsConnected(false);
        setIsLoading(false);
        setIsRecording(false);
        wsRef.current = null;
      };

    } catch (error) {
      console.error('❌ Error connecting:', error);
      addMessage(`❌ Erro ao conectar: ${error.message}`);
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Falha ao conectar ao agente",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    if (!wsRef.current || !isConnected) {
      toast({
        title: "Erro",
        description: "Não conectado ao agente",
        variant: "destructive",
      });
      return;
    }

    try {
      audioRecorderRef.current = new SimpleAudioRecorder((audioData: ArrayBuffer) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Convert to base64 and send
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
          wsRef.current.send(JSON.stringify({
            type: 'audio_stream',
            audio_base_64: base64Audio
          }));
        }
      });

      await audioRecorderRef.current.start();
      setIsRecording(true);
      addMessage('🎤 Gravação iniciada - fale agora');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      addMessage(`❌ Erro ao iniciar gravação: ${error.message}`);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
      setIsRecording(false);
      addMessage('🎤 Gravação parada');
    }
  };

  const endConversation = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end_conversation' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setConversationId(null);
    addMessage('🛑 Conversa encerrada');
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary">Conectando...</Badge>;
    }
    if (isConnected) {
      return <Badge className="bg-green-500">Conectado</Badge>;
    }
    return <Badge variant="destructive">Desconectado</Badge>;
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ElevenLabs Conversational AI</CardTitle>
            <CardDescription>
              Conecte-se a um agente conversacional da ElevenLabs via WebSocket
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isAgentSpeaking && <Badge className="bg-blue-500">🔊 Falando</Badge>}
            {isRecording && <Badge className="bg-red-500 animate-pulse">🎤 Gravando</Badge>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-2">
          <Label htmlFor="agent-id">Agent ID</Label>
          <Input
            id="agent-id"
            placeholder="Digite o ID do seu agente ElevenLabs..."
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={isConnected}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {!isConnected ? (
            <Button 
              onClick={connectToAgent} 
              disabled={isLoading || !agentId.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Conectando...' : 'Conectar ao Agente'}
            </Button>
          ) : (
            <>
              {!isRecording ? (
                <Button 
                  onClick={startRecording} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isAgentSpeaking}
                >
                  🎤 Iniciar Gravação
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording} 
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  ⏹️ Parar Gravação
                </Button>
              )}
              <Button 
                onClick={endConversation} 
                variant="destructive"
              >
                Encerrar Conversa
              </Button>
            </>
          )}
          <Button onClick={clearMessages} variant="ghost" size="sm">
            Limpar Log
          </Button>
        </div>

        {/* Conversation Info */}
        {conversationId && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm">
              <strong>ID da Conversa:</strong> {conversationId}
            </div>
          </div>
        )}

        {/* Messages Log */}
        <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Log da Conversa:</div>
            <div className="text-xs text-muted-foreground">
              {messages.length} mensagens
            </div>
          </div>
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma atividade ainda...</div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <div key={index} className="text-xs font-mono break-all">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>API:</strong> ElevenLabs Conversational AI WebSocket</p>
          <p><strong>Recurso:</strong> Conversa bidirecional com áudio em tempo real</p>
          <p><strong>Microfone:</strong> Necessário para interação por voz</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevenLabsConversationalAI;