import React, { useEffect } from 'react';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  useEffect(() => {
    console.log('🔧 [PARENT COMPONENT] ThreeDotsEmbeddedConvai mounted');
    
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 [PARENT COMPONENT] Received message from iframe:', event.data);
      
      if (event.data.type === 'openExternalURL') {
        console.log('🌐 [PARENT COMPONENT] Opening external URL:', event.data.url);
        window.open(event.data.url, '_blank');
        console.log('✅ [PARENT COMPONENT] External URL opened in new tab');
      } else if (event.data.type === 'navigate') {
        console.log('📍 [PARENT COMPONENT] Navigating to:', event.data.url);
        window.location.href = event.data.url;
        console.log('✅ [PARENT COMPONENT] Navigation initiated');
      }
    };

    console.log('👂 [PARENT COMPONENT] Adding message event listener');
    window.addEventListener('message', handleMessage);

    return () => {
      console.log('🧹 [PARENT COMPONENT] Cleaning up message event listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  console.log('🖼️ [PARENT COMPONENT] Rendering iframe widget');

  // Return iframe that loads the widget
  return (
    <iframe
      src="/widget-iframe.html?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b"
      className={className}
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        background: 'transparent',
        pointerEvents: 'auto',
        zIndex: 9999
      }}
      title="ThreeDotts AI Assistant"
      onLoad={() => console.log('✅ [PARENT COMPONENT] Iframe loaded successfully')}
      onError={() => console.error('❌ [PARENT COMPONENT] Iframe failed to load')}
    />
  );
};

export default ThreeDotsEmbeddedConvai;