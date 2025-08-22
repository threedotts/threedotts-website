import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface ElevenLabsMessage {
  type?: string;
  contextId?: string;
  audio?: string;
  is_final?: boolean;
  error?: string;
  message?: string;
}

export const ElevenLabsSDKTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceId, setVoiceId] = useState("9BWtsMINqrJLrRacOk9x"); // Aria voice
  const [testMessage, setTestMessage] = useState("Hello! This is a test of the ElevenLabs multi-context WebSocket API.");
  const [messages, setMessages] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const contextIdRef = useRef<string>("test-context-1");
  const audioQueueRef = useRef<{ buffer: AudioBuffer; contextId: string }[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const playAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) {
      return;
    }

    isPlayingRef.current = true;
    
    while (audioQueueRef.current.length > 0) {
      const audioItem = audioQueueRef.current.shift()!;
      
      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioItem.buffer;
        source.connect(audioContextRef.current.destination);
        
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start(0);
        });
        
        addMessage(`🔊 Áudio reproduzido (contexto: ${audioItem.contextId})`);
      } catch (error) {
        console.error('❌ Erro ao reproduzir áudio:', error);
        addMessage(`❌ Erro na reprodução: ${error.message}`);
      }
    }
    
    isPlayingRef.current = false;
  };

  const connectWebSocket = async () => {
    if (!voiceId) {
      toast({
        title: "Erro",
        description: "Por favor, insira um Voice ID válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addMessage('🔌 Conectando via Supabase Edge Function...');

    try {
      const wsUrl = `wss://dkqzzypemdewomxrjftv.supabase.co/functions/v1/elevenlabs-websocket?voice_id=${voiceId}&model_id=eleven_flash_v2_5`;

      console.log('🔌 Conectando ao WebSocket via Supabase:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        addMessage('✅ WebSocket conectado via Supabase');
        setIsConnected(true);
        setIsLoading(false);
        wsRef.current = ws;
        
        // Initialize audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        toast({
          title: "Sucesso",
          description: "Conectado ao ElevenLabs via Supabase!",
          variant: "default",
        });
      };

      ws.onmessage = async (event) => {
        try {
          const data: ElevenLabsMessage = JSON.parse(event.data);
          console.log('📨 Mensagem recebida:', data);

          if (data.type === 'connection_ready') {
            addMessage(`✅ ${data.message}`);
            return;
          }

          if (data.audio && audioContextRef.current) {
            addMessage(`📨 Áudio recebido (contexto: ${data.contextId || 'unknown'})`);
            
            // Decode base64 audio data
            const binaryString = atob(data.audio);
            const arrayBuffer = new ArrayBuffer(binaryString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < binaryString.length; i++) {
              uint8Array[i] = binaryString.charCodeAt(i);
            }

            try {
              const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
              
              // Add to queue
              audioQueueRef.current.push({
                buffer: audioBuffer,
                contextId: data.contextId || 'unknown'
              });
              
              // Start playing if not already playing
              playAudioQueue();
              
            } catch (audioError) {
              console.error('❌ Erro ao decodificar áudio:', audioError);
              addMessage(`❌ Erro ao decodificar áudio: ${audioError.message}`);
            }
          }

          if (data.is_final) {
            console.log(`✅ Contexto ${data.contextId} finalizado`);
            addMessage(`✅ Contexto ${data.contextId} finalizado`);
          }

          if (data.error) {
            console.error('❌ Erro do servidor:', data.error);
            addMessage(`❌ Erro do servidor: ${data.error}`);
            toast({
              title: "Erro do Servidor",
              description: data.error,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          addMessage(`❌ Erro ao processar mensagem: ${error.message}`);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        addMessage('❌ Erro na conexão WebSocket');
        setIsLoading(false);
        toast({
          title: "Erro de Conexão",
          description: "Erro na conexão WebSocket via Supabase",
          variant: "destructive",
        });
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket fechado:', event.code, event.reason);
        addMessage(`🔌 WebSocket fechado (${event.code}: ${event.reason})`);
        setIsConnected(false);
        setIsLoading(false);
        wsRef.current = null;
      };

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      addMessage(`❌ Erro ao conectar: ${error.message}`);
      setIsLoading(false);
      toast({
        title: "Erro",
        description: "Falha ao conectar ao WebSocket",
        variant: "destructive",
      });
    }
  };

  const sendTestMessage = () => {
    if (!wsRef.current || !testMessage.trim()) {
      toast({
        title: "Erro",
        description: "WebSocket não conectado ou mensagem vazia",
        variant: "destructive",
      });
      return;
    }

    const message = {
      text: testMessage.trim(),
      context_id: contextIdRef.current,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    console.log('📤 Enviando mensagem:', message);
    addMessage(`📤 Enviando texto: "${testMessage.substring(0, 50)}..."`);
    wsRef.current.send(JSON.stringify(message));
    
    toast({
      title: "Mensagem Enviada",
      description: "Texto enviado para síntese de voz",
      variant: "default",
    });
  };

  const flushContext = () => {
    if (!wsRef.current) {
      toast({
        title: "Erro",
        description: "WebSocket não conectado",
        variant: "destructive",
      });
      return;
    }

    const message = {
      context_id: contextIdRef.current,
      flush: true
    };

    console.log('🔄 Fazendo flush do contexto:', message);
    addMessage(`🔄 Flush do contexto: ${contextIdRef.current}`);
    wsRef.current.send(JSON.stringify(message));
  };

  const closeContext = () => {
    if (!wsRef.current) {
      toast({
        title: "Erro",
        description: "WebSocket não conectado",
        variant: "destructive",
      });
      return;
    }

    const oldContextId = contextIdRef.current;
    const message = {
      context_id: oldContextId,
      close_context: true
    };

    console.log('🚪 Fechando contexto:', message);
    addMessage(`🚪 Fechando contexto: ${oldContextId}`);
    wsRef.current.send(JSON.stringify(message));
    
    // Create new context ID for next message
    contextIdRef.current = `context-${Date.now()}`;
    addMessage(`🆕 Novo contexto criado: ${contextIdRef.current}`);
  };

  const keepContextAlive = () => {
    if (!wsRef.current) {
      toast({
        title: "Erro",
        description: "WebSocket não conectado",
        variant: "destructive",
      });
      return;
    }

    const message = {
      context_id: contextIdRef.current,
      text: ""
    };

    console.log('💓 Mantendo contexto vivo:', message);
    addMessage(`💓 Mantendo contexto vivo: ${contextIdRef.current}`);
    wsRef.current.send(JSON.stringify(message));
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      addMessage('🛑 Encerrando conversação...');
      // Close all contexts and connection
      wsRef.current.send(JSON.stringify({ close_socket: true }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
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
            <CardTitle>ElevenLabs Multi-Context WebSocket</CardTitle>
            <CardDescription>
              Widget customizado usando Supabase Edge Function como proxy para ElevenLabs
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="voice-id">Voice ID</Label>
            <Input
              id="voice-id"
              placeholder="Voice ID (ex: 9BWtsMINqrJLrRacOk9x)"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={isConnected}
            />
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="test-message">Mensagem de Teste</Label>
          <Textarea
            id="test-message"
            placeholder="Digite o texto para síntese de voz..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {!isConnected ? (
            <Button 
              onClick={connectWebSocket} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Conectando...' : 'Conectar WebSocket'}
            </Button>
          ) : (
            <>
              <Button onClick={sendTestMessage} className="bg-green-600 hover:bg-green-700">
                Enviar Texto
              </Button>
              <Button onClick={flushContext} variant="outline">
                Flush Contexto
              </Button>
              <Button onClick={closeContext} variant="outline">
                Fechar Contexto
              </Button>
              <Button onClick={keepContextAlive} variant="outline">
                Manter Vivo
              </Button>
              <Button onClick={disconnectWebSocket} variant="destructive">
                Desconectar
              </Button>
            </>
          )}
          <Button onClick={clearMessages} variant="ghost" size="sm">
            Limpar Log
          </Button>
        </div>

        {/* Current Context Info */}
        {isConnected && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm">
              <strong>Contexto Atual:</strong> {contextIdRef.current}
            </div>
          </div>
        )}

        {/* Messages Log */}
        <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Log de Atividade:</div>
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
          <p><strong>Método:</strong> Supabase Edge Function Proxy para ElevenLabs Multi-Context WebSocket</p>
          <p><strong>Endpoint:</strong> wss://dkqzzypemdewomxrjftv.supabase.co/functions/v1/elevenlabs-websocket</p>
          <p><strong>Modelo:</strong> eleven_flash_v2_5</p>
          <p><strong>Recursos:</strong> Múltiplos contextos, controle de interrupções, flush manual</p>
          <p><strong>Vantagem:</strong> Resolve problemas de CSP, API key segura no servidor</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevenLabsSDKTest;