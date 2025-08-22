import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, X } from 'lucide-react';
import CustomElevenLabsWidget from './CustomElevenLabsWidget';

interface ThreeDotsEmbeddedConvaiProps {
  agentId?: string;
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  agentId = 'agent_01k02ete3tfjgrq97y8a7v541y',
  className = ''
}) => {
  const [showWidget, setShowWidget] = useState(false);

  const handleCallClick = () => {
    setShowWidget(true);
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
  };

  if (showWidget) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="relative">
          <Button
            onClick={handleCloseWidget}
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 z-10 bg-background border border-border shadow-md hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
          <CustomElevenLabsWidget
            agentId={agentId}
            onClose={handleCloseWidget}
            className="bg-background shadow-xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <div className="bg-background border border-border rounded-2xl shadow-lg p-4 max-w-xs">
        {/* Avatar and Call Button Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-lg">
            3D
          </div>
          
          {/* Call Button */}
          <Button
            onClick={handleCallClick}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-full py-2 px-4 font-medium"
          >
            <Phone className="w-4 h-4 mr-2" />
            Ligar
          </Button>
        </div>
        
        {/* Powered by text */}
        <p className="text-xs text-muted-foreground text-center">
          Powered by ThreeDots Conversational AI
        </p>
      </div>
    </div>
  );
};

export default ThreeDotsEmbeddedConvai;