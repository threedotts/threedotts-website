import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Send, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { ElevenLabsWebSocket, ElevenLabsMessage } from '@/utils/ElevenLabsWebSocket';

interface CustomElevenLabsWidgetProps {
  agentId: string;
  apiKey?: string; // Optional for testing
  onClose?: () => void;
  className?: string;
}

const CustomElevenLabsWidget: React.FC<CustomElevenLabsWidgetProps> = ({
  agentId,
  apiKey,
  onClose,
  className = ''
}) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Changed from isRecording to isMuted
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [messages, setMessages] = useState<ElevenLabsMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const elevenLabsRef = useRef<ElevenLabsWebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (elevenLabsRef.current) {
        elevenLabsRef.current.disconnect();
      }
    };
  }, []);

  const handleMessage = (message: ElevenLabsMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Update UI states based on message type
    switch (message.type) {
      case 'audio_response':
        setIsSpeaking(true);
        break;
      case 'agent_response':
        setIsSpeaking(false);
        break;
      case 'user_transcript':
        // User finished speaking
        break;
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    
    if (connected) {
      toast({
        title: "Conectado",
        description: "Conexão estabelecida com o agente de IA",
      });
    } else {
      setIsMuted(false);
      setIsSpeaking(false);
    }
  };

  const handleError = (error: string) => {
    console.error('ElevenLabs error:', error);
    toast({
      title: "Erro de Conexão",
      description: error,
      variant: "destructive",
    });
    setConnectionStatus('disconnected');
  };

  const startCall = async () => {
    if (elevenLabsRef.current?.getConnectionStatus()) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      elevenLabsRef.current = new ElevenLabsWebSocket(
        agentId,
        apiKey || '', // Pass API key if provided
        handleMessage,
        handleConnectionChange,
        handleError
      );
      
      await elevenLabsRef.current.connect();
    } catch (error) {
      console.error('Error starting call:', error);
      handleError(`Falha ao iniciar chamada: ${error}`);
    }
  };

  const endCall = () => {
    if (elevenLabsRef.current) {
      elevenLabsRef.current.disconnect();
      elevenLabsRef.current = null;
    }
    setMessages([]);
  };

  const toggleMute = () => {
    if (!elevenLabsRef.current || !isConnected) {
      toast({
        title: "Não Conectado",
        description: "Inicie uma chamada primeiro",
        variant: "destructive",
      });
      return;
    }

    const newMuteState = !isMuted;
    elevenLabsRef.current.setMuted(newMuteState);
    setIsMuted(newMuteState);
  };

  const sendTextMessage = () => {
    if (!elevenLabsRef.current || !isConnected || !textMessage.trim()) {
      return;
    }

    elevenLabsRef.current.sendTextMessage(textMessage);
    setTextMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Assistente de Voz</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <Badge variant="outline" className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={startCall}
              disabled={connectionStatus === 'connecting'}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Iniciar Chamada'}
            </Button>
          ) : (
            <Button 
              onClick={endCall}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Encerrar Chamada
            </Button>
          )}
        </div>

        {/* Voice Controls */}
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "default"}
                size="lg"
                className="h-12 w-12 rounded-full"
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              
              {isSpeaking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Volume2 className="w-4 h-4" />
                  <span>Assistente falando...</span>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="flex gap-2">
              <Input
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="flex-1"
              />
              <Button 
                onClick={sendTextMessage}
                disabled={!textMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
             {!isMuted && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Microfone Ativo</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Reproduzindo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Messages Display */}
        {messages.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
            {messages.slice(-5).map((msg, index) => (
              <div key={index} className="p-2 bg-muted rounded text-muted-foreground">
                <span className="font-medium">{msg.type}:</span>{' '}
                {msg.user_transcript || msg.agent_response || 'Audio data'}
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="sm"
            className="w-full"
          >
            Fechar Widget
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomElevenLabsWidget;