import React, { useEffect } from 'react';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  useEffect(() => {
    console.log('🔧 Loading embedded widget script...');
    
    // Check if script is already loaded
    if (document.querySelector('script[src*="widget-script"]')) {
      console.log('⚠️ Widget script already exists, skipping...');
      return;
    }

    // Create and load widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b&v=49';
    script.onerror = (error) => {
      console.error('❌ Failed to load widget script:', error);
    };
    
    script.onload = () => {
      console.log('✅ Widget script loaded successfully');
      // Configure widget when loaded
      setTimeout(() => {
        if ((window as any).threedottsWidget) {
          (window as any).threedottsWidget.configure({
            organizationId: '1e926240-b303-444b-9f8c-57abd9fa657b'
          });
          console.log('✅ Widget configured with organizationId!');
        } else {
          console.error('❌ Widget not found after loading script');
        }
      }, 100);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup - remove script when component unmounts
      const existingScript = document.querySelector('script[src*="widget-script"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Return empty div since the script will handle the UI
  return <div className={className} />;
};

export default ThreeDotsEmbeddedConvai;