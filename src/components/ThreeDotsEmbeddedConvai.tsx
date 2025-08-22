import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Send, ChevronDown, Mic, MicOff } from 'lucide-react';
import { useGlobalConvaiState } from '@/hooks/useGlobalConvaiState';

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
      <div className={`bg-background border border-border shadow-2xl transition-all duration-300 ease-out ${
        state.isExpanded 
          ? 'rounded-2xl p-6 w-80 animate-scale-in' 
          : 'rounded-full pl-2 pr-4 py-2 animate-scale-in hover-scale'
      }`}>
        
        {!state.isExpanded ? (
          // Collapsed state - pill format
          <div className="flex items-center gap-3">
            {/* Avatar image */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=40&h=40&fit=crop&crop=face&auto=format" 
                alt="AI Assistant"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Call Button */}
            <Button
              onClick={() => actions.setIsExpanded(true)}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 py-2 font-medium text-sm transition-all duration-200"
            >
              <Phone className="w-4 h-4 mr-1" />
              Ligar
            </Button>
          </div>
        ) : (
          // Expanded state
          <div className="animate-fade-in">
            {/* Header with avatar and controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Large avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=64&h=64&fit=crop&crop=face&auto=format" 
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    {state.isConnected ? (state.isSpeaking ? 'Falando...' : 'Conectado') : 'Disponível'}
                  </p>
                </div>
              </div>
              
              {/* Minimize button */}
              <Button
                onClick={() => actions.setIsExpanded(false)}
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted transition-colors duration-200"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Call controls */}
            <div className="flex gap-2 mb-4">
              {!state.isConnected ? (
                <Button
                  onClick={actions.handleConnect}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full py-2 transition-colors duration-200"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={actions.handleDisconnect}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full py-2 transition-colors duration-200"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                  <Button
                    onClick={actions.toggleMute}
                    variant={state.isMuted ? "destructive" : "secondary"}
                    size="icon"
                    className="rounded-full transition-colors duration-200"
                  >
                    {state.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>

            {/* Message input */}
            <div className="flex gap-2">
              <Input
                value={state.message}
                onChange={(e) => actions.setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enviar mensagem"
                className="flex-1 rounded-full border-muted-foreground/20 focus:border-primary transition-colors duration-200"
              />
              <Button
                onClick={actions.sendMessage}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 transition-colors duration-200"
                disabled={!state.message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
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