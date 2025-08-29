import React, { useEffect } from 'react';

interface ThreeDotsEmbeddedConvaiProps {
  className?: string;
}

const ThreeDotsEmbeddedConvai: React.FC<ThreeDotsEmbeddedConvaiProps> = ({
  className = ''
}) => {
  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'openExternalURL') {
        window.open(event.data.url, '_blank');
      } else if (event.data.type === 'navigate') {
        window.location.href = event.data.url;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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
    />
  );
};

export default ThreeDotsEmbeddedConvai;