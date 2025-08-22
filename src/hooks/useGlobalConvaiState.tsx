import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { ElevenLabsWebSocket, ElevenLabsMessage } from '@/utils/ElevenLabsWebSocket';
import { useToast } from '@/hooks/use-toast';

interface ConvaiState {
  isExpanded: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  message: string;
  messages: ElevenLabsMessage[];
}

interface ConvaiContextType {
  state: ConvaiState;
  actions: {
    setIsExpanded: (expanded: boolean) => void;
    setMessage: (message: string) => void;
    handleConnect: () => Promise<void>;
    handleDisconnect: () => void;
    toggleMute: () => void;
    sendMessage: () => void;
  };
}

const ConvaiContext = createContext<ConvaiContextType | undefined>(undefined);

export const ConvaiProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const webSocketRef = useRef<ElevenLabsWebSocket | null>(null);
  const [state, setState] = useState<ConvaiState>({
    isExpanded: false,
    isConnected: false,
    isMuted: false,
    isSpeaking: false,
    message: '',
    messages: []
  });

  const handleMessage = (message: ElevenLabsMessage) => {
    console.log('Global message received:', message.type);
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      isSpeaking: message.type === 'agent_response' || message.type === 'agent_response_correction' 
        ? false 
        : message.audio_event ? true : prev.isSpeaking
    }));
  };

  const handleConnectionChange = (connected: boolean) => {
    setState(prev => ({ ...prev, isConnected: connected, isSpeaking: false }));
    if (connected) {
      toast({
        title: "Conectado",
        description: "Chamada iniciada com sucesso",
      });
    } else {
      toast({
        title: "Desconectado", 
        description: "Chamada finalizada",
      });
    }
  };

  const handleError = (error: string) => {
    toast({
      title: "Erro",
      description: error,
      variant: "destructive",
    });
  };

  const actions = {
    setIsExpanded: (expanded: boolean) => {
      setState(prev => ({ ...prev, isExpanded: expanded }));
    },
    setMessage: (message: string) => {
      setState(prev => ({ ...prev, message }));
    },
    handleConnect: async () => {
      try {
        if (!webSocketRef.current) {
          webSocketRef.current = new ElevenLabsWebSocket(
            'agent_01k02ete3tfjgrq97y8a7v541y',
            '',
            handleMessage,
            handleConnectionChange,
            handleError
          );
        }
        await webSocketRef.current.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
        handleError('Falha ao conectar');
      }
    },
    handleDisconnect: () => {
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
      }
    },
    toggleMute: () => {
      if (webSocketRef.current) {
        const newMutedState = !state.isMuted;
        webSocketRef.current.setMuted(newMutedState);
        setState(prev => ({ ...prev, isMuted: newMutedState }));
      }
    },
    sendMessage: () => {
      if (state.message.trim() && webSocketRef.current) {
        webSocketRef.current.sendTextMessage(state.message);
        setState(prev => ({ ...prev, message: '' }));
      }
    }
  };

  // Global persistence - prevent disconnection during navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only disconnect on actual page unload, not navigation
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ConvaiContext.Provider value={{ state, actions }}>
      {children}
    </ConvaiContext.Provider>
  );
};

export const useGlobalConvaiState = () => {
  const context = useContext(ConvaiContext);
  if (context === undefined) {
    throw new Error('useGlobalConvaiState must be used within a ConvaiProvider');
  }
  return context;
};