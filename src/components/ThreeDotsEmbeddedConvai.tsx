import React from 'react';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  console.log('🔧 [REACT COMPONENT] ThreeDotsEmbeddedConvai rendering...');
  
  // This component loads the SharedWorker-based widget injector
  // The injector maintains WebSocket connection across page navigations
  React.useEffect(() => {
    console.log('🚀 [REACT COMPONENT] Loading SharedWorker widget injector...');
    
    // Check if injector script is already loaded
    if (document.querySelector('script[src="/widget-injector.js"]')) {
      console.log('⚠️ [REACT COMPONENT] Injector script already loaded, skipping...');
      return;
    }
    
    const script = document.createElement('script');
    script.src = '/widget-injector.js';
    script.onload = () => {
      console.log('✅ [REACT COMPONENT] SharedWorker widget injector loaded');
    };
    script.onerror = () => {
      console.error('❌ [REACT COMPONENT] Failed to load SharedWorker widget injector');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount to maintain persistence
      console.log('🔄 [REACT COMPONENT] Component unmounting but keeping SharedWorker injector');
    };
  }, []);

  // Return empty div since the injector handles the UI
  return <div className={className} style={{ display: 'none' }} />;
};

export default ThreeDotsEmbeddedConvai;