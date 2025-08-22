import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Declare global type for ElevenLabs widget
declare global {
  interface Window {
    ElevenLabsConvaiWidget?: {
      init: (config: any) => void;
    };
  }
}

const ElevenLabsSDKTest: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startConversation = useCallback(async () => {
    if (isConnected) return;

    try {
      setStatus('connecting');
      addMessage('🚀 Carregando widget oficial da ElevenLabs...');
      
      // Check if ElevenLabs widget is loaded
      if (typeof window.ElevenLabsConvaiWidget === 'undefined') {
        addMessage('⏳ Aguardando carregamento do widget...');
        // Wait for widget to load
        let attempts = 0;
        while (typeof window.ElevenLabsConvaiWidget === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      if (typeof window.ElevenLabsConvaiWidget === 'undefined') {
        throw new Error('Widget da ElevenLabs não carregou');
      }

      addMessage('✅ Widget carregado, inicializando...');

      // Initialize the official ElevenLabs widget
      const widget = window.ElevenLabsConvaiWidget.init({
        agentId: 'agent_01k02ete3tfjgrq97y8a7v541y',
        variant: 'compact',
        placement: 'bottom-right',
        expandable: 'always',
        onConnect: () => {
          setStatus('connected');
          setIsConnected(true);
          addMessage('✅ Conectado com sucesso!');
          toast({
            title: "Sucesso!",
            description: "Conectado ao agente ElevenLabs",
          });
        },
        onDisconnect: () => {
          setStatus('disconnected');
          setIsConnected(false);
          addMessage('❌ Desconectado do agente');
        },
        onError: (error: any) => {
          setStatus('disconnected');
          addMessage(`❌ Erro: ${error.message || error}`);
          console.error('ElevenLabs Widget Error:', error);
          toast({
            title: "Erro de Conexão",
            description: error.message || "Falha ao conectar",
            variant: "destructive",
          });
        },
        onMessage: (message: any) => {
          addMessage(`📨 Mensagem: ${JSON.stringify(message).substring(0, 100)}...`);
          console.log('Widget Message:', message);
        }
      });

      addMessage('🎯 Widget inicializado com sucesso');

    } catch (error: any) {
      setStatus('disconnected');
      addMessage(`❌ Falha ao inicializar: ${error.message}`);
      console.error('Erro ao inicializar widget:', error);
      toast({
        title: "Falha na Conexão",
        description: error.message || "Não foi possível inicializar",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);

  const stopConversation = useCallback(() => {
    try {
      // The official widget handles cleanup automatically
      setIsConnected(false);
      setStatus('disconnected');
      addMessage('🛑 Conversação encerrada');
    } catch (error: any) {
      addMessage(`❌ Erro ao encerrar: ${error.message}`);
    }
  }, []);

  const sendTestMessage = useCallback(() => {
    // The official widget handles interactions through its UI
    addMessage('💡 Use a interface do widget para interagir');
  }, []);

  const clearMessages = () => {
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        // Widget cleanup is handled automatically
      }
    };
  }, [isConnected]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Widget Oficial ElevenLabs</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {!isConnected ? (
            <Button 
              onClick={startConversation} 
              disabled={status === 'connecting'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {status === 'connecting' ? 'Conectando...' : 'Iniciar Widget Oficial'}
            </Button>
          ) : (
            <>
              <Button onClick={stopConversation} variant="destructive">
                Parar Widget
              </Button>
              <Button onClick={sendTestMessage} variant="outline">
                Informações
              </Button>
            </>
          )}
          <Button onClick={clearMessages} variant="ghost" size="sm">
            Limpar Log
          </Button>
        </div>

        <div className="bg-muted p-4 rounded max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Widget Oficial Log:</div>
            <div className="text-xs text-muted-foreground">
              {messages.length} mensagens
            </div>
          </div>
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma mensagem ainda...</div>
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Método:</strong> Widget Oficial ElevenLabs</p>
          <p><strong>Agent ID:</strong> agent_01k02ete3tfjgrq97y8a7v541y</p>
          <p><strong>Vantagens:</strong> Widget oficial integrado, funciona sem proxy</p>
          <p>Este é o widget oficial da ElevenLabs carregado via CDN, sem necessidade de proxy.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevenLabsSDKTest;