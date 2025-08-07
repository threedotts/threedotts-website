import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Add Content Security Policy meta tag for enhanced XSS protection
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self'; 
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://cdn.gpteng.co https://elevenlabs.io https://*.elevenlabs.io;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
      font-src 'self' https://fonts.gstatic.com; 
      img-src 'self' data: https:; 
      connect-src 'self' https://dkqzzypemdewomxrjftv.supabase.co https://*.supabase.co wss://dkqzzypemdewomxrjftv.supabase.co wss://*.supabase.co https://elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io https://api.us.elevenlabs.io wss://api.us.elevenlabs.io https://lovable.dev; 
      media-src 'self' blob: https://dkqzzypemdewomxrjftv.supabase.co;
      worker-src 'self' blob: https://cdn.jsdelivr.net https://elevenlabs.io https://*.elevenlabs.io;
      frame-src 'self';
    `.replace(/\s+/g, ' ').trim();
    
    // Remove existing CSP meta tag if present
    const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCsp) {
      existingCsp.remove();
    }
    
    document.head.appendChild(cspMeta);

    // Add security headers that can be set via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityHeaders.forEach(header => {
      const existingHeader = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (existingHeader) {
        existingHeader.remove();
      }
      
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });

    // Cleanup function
    return () => {
      const metaElements = document.querySelectorAll('meta[http-equiv]');
      metaElements.forEach(meta => {
        const httpEquiv = meta.getAttribute('http-equiv');
        if (httpEquiv && [
          'Content-Security-Policy',
          'X-Content-Type-Options',
          'Referrer-Policy'
        ].includes(httpEquiv)) {
          meta.remove();
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything
};