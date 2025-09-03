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
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b&v=60';
    script.onerror = (error) => {
      console.error('❌ Failed to load widget script:', error);
    };
    
    script.onload = () => {
      console.log('✅ Widget script loaded successfully');
      
    (window as any).redirectToExternalURL = (parameters: { url: string }) => {
      const url = parameters?.url;
      if (url) {
        console.log('🔗 Redirecting to:', url);
        // Perform the actual redirect
        if (url.startsWith('http')) {
          window.open(url, '_blank');
          return `Opened ${url} in new tab`;
        } else {
          window.location.href = url;
          return `Redirected to ${url}`;
        }
      } else {
        throw new Error('URL parameter is required');
      }
    };

    // LAYER 3: Server tool for credit checking during conversation
    (window as any).checkCredits = async (parameters: { organization_id: string }) => {
      const orgId = parameters?.organization_id || '${organizationId}';
      console.log('🔍 Server tool: Checking credits for organization:', orgId);
      
      try {
        const response = await fetch('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/credit-validator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: orgId,
            action: 'check'
          })
        });
        
        const data = await response.json();
        
        if (!data.has_credits || data.current_credits <= 0) {
          // Trigger immediate conversation end
          if ((window as any).threedottsWidget) {
            (window as any).threedottsWidget.endConversationDueToCredits();
          }
          return `Credits depleted. Current balance: ${data.current_credits || 0}. Conversation terminated.`;
        }
        
        return `Credits available: ${data.current_credits}. Conversation can continue.`;
      } catch (error) {
        console.error('Credit check failed:', error);
        return `Credit check failed: ${error.message}`;
      }
    };
      
      // Configure widget when loaded with credit validation
      setTimeout(async () => {
        if ((window as any).threedottsWidget) {
          // LAYER 4: Pre-configure credit validation
          console.log('🔍 Validating credits before widget configuration...');
          
          try {
            const creditResponse = await fetch('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/credit-validator', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                organization_id: '1e926240-b303-444b-9f8c-57abd9fa657b',
                action: 'validate_and_block'
              })
            });
            
            const creditData = await creditResponse.json();
            
            if (creditData.blocked) {
              console.log('❌ Credits validation failed:', creditData.reason);
              
              // Show no credits message in widget
              (window as any).threedottsWidget.showError({
                title: 'No Credits Available',
                message: creditData.message || 'Please top up your account to use AI conversations',
                credits: creditData.current_credits || 0
              });
              return;
            }
            
            console.log('✅ Credits validated, configuring widget...');
            (window as any).threedottsWidget.configure({
              organizationId: '1e926240-b303-444b-9f8c-57abd9fa657b',
              creditsValidated: true,
              currentCredits: creditData.current_credits
            });
            console.log('✅ Widget configured with organizationId and credit validation!');
          } catch (error) {
            console.error('❌ Credit validation failed:', error);
            (window as any).threedottsWidget.showError({
              title: 'Validation Error',
              message: 'Unable to validate credits. Please try again.',
              credits: 0
            });
          }
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