import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Send, ChevronDown, Mic, MicOff } from 'lucide-react';
import { useGlobalConvaiState } from '@/hooks/useGlobalConvaiState.tsx';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  const { state, actions } = useGlobalConvaiState();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      actions.sendMessage();
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] ${className}`} style={{ zIndex: 9999 }}>
      <div className={`bg-background/95 backdrop-blur-md border border-primary/10 shadow-lg transition-all duration-200 ${
        state.isExpanded 
          ? 'rounded-lg p-4 w-72' 
          : 'rounded-full pl-2 pr-4 py-2'
      }`}>
        
        {!state.isExpanded ? (
          // Collapsed state - pill format
          <div className="flex items-center gap-3">
            {/* Avatar image */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Call Button */}
            <Button
              onClick={() => actions.setIsExpanded(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 font-medium text-sm"
            >
              <Phone className="w-4 h-4 mr-1" />
              Ligar
            </Button>
          </div>
        ) : (
          // Expanded state - simple and clean
          <div>
            {/* Simple header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=32&h=32&fit=crop&crop=face&auto=format" 
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">AI Assistant</h4>
                  <p className="text-xs text-muted-foreground">
                    {state.isConnected ? (state.isSpeaking ? 'Falando...' : 'Conectado') : 'Disponível'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => actions.setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            {/* Simple controls */}
            <div className="space-y-2">
              {!state.isConnected ? (
                <Button
                  onClick={actions.handleConnect}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={actions.handleDisconnect}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    Desconectar
                  </Button>
                  <Button
                    onClick={actions.toggleMute}
                    variant={state.isMuted ? "destructive" : "secondary"}
                    size="sm"
                  >
                    {state.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              {/* Simple message input */}
              <div className="flex gap-2">
                <Input
                  value={state.message}
                  onChange={(e) => actions.setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mensagem..."
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  onClick={actions.sendMessage}
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!state.message.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Powered by text - outside and below container */}
      <p className="text-[10px] text-muted-foreground text-right mt-2">
        Powered by threedotts AI
      </p>
    </div>
  );
};

export default ThreeDotsEmbeddedConvai;