import React from 'react';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  console.log('🔧 [REACT COMPONENT] ThreeDotsEmbeddedConvai rendering...');
  
  // This component now just loads the external injector script
  // The script will handle creating and managing the persistent iframe
  React.useEffect(() => {
    console.log('🚀 [REACT COMPONENT] Loading widget injector script...');
    
    // Check if injector script is already loaded
    if (document.querySelector('script[src="/widget-injector.js"]')) {
      console.log('⚠️ [REACT COMPONENT] Injector script already loaded, skipping...');
      return;
    }
    
    const script = document.createElement('script');
    script.src = '/widget-injector.js';
    script.onload = () => {
      console.log('✅ [REACT COMPONENT] Widget injector script loaded');
    };
    script.onerror = () => {
      console.error('❌ [REACT COMPONENT] Failed to load widget injector script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount to maintain persistence
      console.log('🔄 [REACT COMPONENT] Component unmounting but keeping injector script');
    };
  }, []);

  // Return empty div since the injector handles the UI
  return <div className={className} style={{ display: 'none' }} />;
};

export default ThreeDotsEmbeddedConvai;