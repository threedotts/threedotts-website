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
      <div className={`bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl transition-all duration-500 ease-out ${
        state.isExpanded 
          ? 'rounded-2xl p-6 w-80 h-auto animate-scale-in' 
          : 'rounded-2xl p-4 w-16 h-16 hover:w-44 group cursor-pointer animate-fade-in hover:shadow-2xl'
      }`}
      onClick={!state.isExpanded ? () => actions.setIsExpanded(true) : undefined}>
        
        {!state.isExpanded ? (
          // Collapsed state - elegant floating orb that expands on hover
          <div className="flex items-center justify-center w-full h-full group-hover:justify-start group-hover:gap-3 transition-all duration-300">
            {/* Avatar with status indicator */}
            <div className="relative">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border border-primary/20">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=32&h=32&fit=crop&crop=face&auto=format" 
                  alt="AI Assistant"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              {/* Status dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                state.isConnected ? 'bg-green-500' : 'bg-muted'
              }`} />
            </div>
            
            {/* Text that appears on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Falar com IA
              </span>
            </div>
          </div>
        ) : (
          // Expanded state
          <div className="animate-fade-in">
            {/* Header with avatar and controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Large avatar with pulse effect when speaking */}
                <div className={`relative ${state.isSpeaking ? 'animate-pulse' : ''}`}>
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-primary/30">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108755-2616b612e602?w=48&h=48&fit=crop&crop=face&auto=format" 
                      alt="AI Assistant"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                  {/* Enhanced status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                    state.isConnected ? 'bg-green-500' : 'bg-muted'
                  }`}>
                    {state.isSpeaking && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Assistente IA</h3>
                  <p className={`text-sm transition-colors duration-200 ${
                    state.isConnected 
                      ? state.isSpeaking 
                        ? 'text-green-600 font-medium' 
                        : 'text-green-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {state.isConnected ? (state.isSpeaking ? 'Falando...' : 'Conectado') : 'Disponível'}
                  </p>
                </div>
              </div>
              
              {/* Minimize button */}
              <Button
                onClick={() => actions.setIsExpanded(false)}
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-muted/50 transition-all duration-200 hover:scale-105"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Call controls */}
            <div className="flex gap-3 mb-6">
              {!state.isConnected ? (
                <Button
                  onClick={actions.handleConnect}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Iniciar Conversa
                </Button>
              ) : (
                <>
                  <Button
                    onClick={actions.handleDisconnect}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Encerrar
                  </Button>
                  <Button
                    onClick={actions.toggleMute}
                    variant={state.isMuted ? "destructive" : "secondary"}
                    size="icon"
                    className={`rounded-2xl p-3 transition-all duration-300 hover:scale-105 ${
                      state.isMuted 
                        ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                        : 'bg-primary/10 hover:bg-primary/20 text-primary'
                    }`}
                  >
                    {state.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>

            {/* Message input */}
            <div className="flex gap-3">
              <Input
                value={state.message}
                onChange={(e) => actions.setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-2xl border-2 border-muted/20 focus:border-primary/50 bg-muted/5 px-4 py-3 transition-all duration-200 focus:shadow-lg"
              />
              <Button
                onClick={actions.sendMessage}
                size="icon"
                className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                disabled={!state.message.trim()}
              >
                <Send className="h-5 w-5" />
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