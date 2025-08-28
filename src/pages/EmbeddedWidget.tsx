import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useGlobalConvaiState } from '@/hooks/useGlobalConvaiState';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    THREEDOTTS_AGENT_ID?: string;
  }
}

interface EmbeddedWidgetProps {}

const EmbeddedWidget: React.FC<EmbeddedWidgetProps> = () => {
  const { state, actions } = useGlobalConvaiState();
  const [config, setConfig] = useState({
    agentId: '',
    theme: 'light',
    position: 'bottom-right'
  });

  // Listen for configuration messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CONFIGURE_WIDGET') {
        console.log('📱 Widget received configuration:', event.data.config);
        setConfig(prev => ({ ...prev, ...event.data.config }));
        
        // Auto-connect if agentId is provided
        if (event.data.config.agentId && !state.isConnected) {
          // Store agentId for connection
          window.THREEDOTTS_AGENT_ID = event.data.config.agentId;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready message to parent
    window.parent.postMessage({ type: 'WIDGET_READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, [state.isConnected]);

  // Custom connect function that uses the configured agentId
  const handleConnect = async () => {
    if (!config.agentId) {
      console.error('No agent ID configured');
      return;
    }
    
    window.THREEDOTTS_AGENT_ID = config.agentId;
    await actions.handleConnect();
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Widget Container */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
        <div className={`bg-background/95 backdrop-blur-md border shadow-lg transition-all duration-300 ease-in-out rounded-full pl-2 pr-4 py-2 ${
          state.isConnected ? 'border-primary/30 shadow-primary/20' : 'border-primary/10'
        }`}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            
            {!state.isConnected ? (
              /* Call Button */
              <Button
                onClick={handleConnect}
                disabled={!config.agentId}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 rounded-full px-4 py-2 font-medium text-sm"
              >
                <Phone className="w-4 h-4 mr-1" />
                {config.agentId ? 'Ligar' : 'Loading...'}
              </Button>
            ) : (
              /* Connected state - End Call and Mute buttons */
              <div className="flex gap-2 animate-scale-in">
                <Button
                  onClick={actions.handleDisconnect}
                  variant="destructive"
                  className="rounded-full w-8 h-8 p-0"
                  size="sm"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
                <Button
                  onClick={actions.toggleMute}
                  variant={state.isMuted ? "destructive" : "secondary"}
                  className="rounded-full w-8 h-8 p-0"
                  size="sm"
                >
                  {state.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Powered by text */}
        <p className="text-[10px] text-muted-foreground text-right mt-2">
          Powered by threedotts AI
        </p>
      </div>
    </div>
  );
};

export default EmbeddedWidget;