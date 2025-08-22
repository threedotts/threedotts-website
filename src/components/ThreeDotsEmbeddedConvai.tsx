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
      {/* Main pill container */}
      <div className="bg-background border border-border rounded-full shadow-lg pl-2 pr-4 py-2 flex items-center gap-3">
        {/* Avatar image */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format" 
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Call Button */}
        <Button
          onClick={handleCallClick}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 py-2 font-medium text-sm"
        >
          <Phone className="w-4 h-4 mr-1" />
          Ligar
        </Button>
      </div>
      
      {/* Powered by text - outside and below container */}
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Powered by threedotts AI
      </p>
    </div>
  );
};

export default ThreeDotsEmbeddedConvai;