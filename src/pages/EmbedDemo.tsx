import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Code, Palette, Smartphone, Zap } from 'lucide-react';
import { toast } from "sonner";
import { useEffect } from 'react';

const EmbedDemo = () => {
  // Add embedded widget script to this page for testing
  useEffect(() => {
    console.log('🔧 EmbedDemo useEffect triggered - adding widget script...');
    
    // Check if script is already loaded
    if (document.querySelector('script[src*="widget-script"]')) {
      console.log('⚠️ Widget script already exists, skipping...');
      return;
    }

    console.log('🔧 Loading widget script for embed demo...');
    
    // Create and load widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b&v=38';
    script.onerror = (error) => {
      console.error('❌ Failed to load widget script:', error);
    };
    
    // Add error handling for HTTP errors (script loads but returns error response)
    script.onload = () => {
      console.log('📥 Script tag loaded, checking response...');
      
      // Check if the script actually loaded JavaScript or returned an error
      fetch(script.src)
        .then(response => {
          console.log('📊 Widget script fetch response:', response.status, response.statusText);
          
          if (!response.ok) {
            response.text().then(errorText => {
              console.error('❌ Widget script returned error:', errorText);
              // Show user-friendly error message
              const errorDiv = document.createElement('div');
              errorDiv.style.cssText = `
                position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                background: #fee; border: 1px solid #fcc; color: #c33;
                padding: 12px; border-radius: 8px; max-width: 300px;
                font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
              `;
              errorDiv.innerHTML = `
                <strong>Widget Error:</strong><br>
                ${errorText}
              `;
              document.body.appendChild(errorDiv);
            });
            return;
          }
          
          console.log('✅ Widget script response OK');
        })
        .catch(fetchError => {
          console.error('❌ Error fetching widget script:', fetchError);
        });
      
      console.log('✅ Widget script loaded, configuring...');
      // Configure widget when loaded
      setTimeout(() => {
        if ((window as any).threedottsWidget) {
          (window as any).threedottsWidget.configure({
            organizationId: '1e926240-b303-444b-9f8c-57abd9fa657b' // Real organization ID
          });
          console.log('✅ Embed demo widget configured with organizationId!');
        } else {
          console.error('❌ Widget not found after loading script - window.threedottsWidget is:', (window as any).threedottsWidget);
        }
      }, 100);
    };
    
    console.log('📝 Adding script to document head...');
    document.head.appendChild(script);
    
    return () => {
      console.log('🧹 Cleaning up widget script...');
      // Cleanup - remove script when component unmounts
      const existingScript = document.querySelector('script[src*="widget-script"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const embedCode = `<!-- ThreeDotts AI Widget -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=your-organization-id&v=38"></script>

<!-- OR configure via JavaScript -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?v=38"></script>
<script>
  // Configure with your Organization ID
  window.addEventListener('load', function() {
    if (window.threedottsWidget) {
      window.threedottsWidget.configure({
        organizationId: 'your-organization-id'
      });
    }
  });
</script>`;

  const advancedEmbedCode = `<!-- Alternative: Use URL parameter -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=your-org-id&v=38"></script>

<!-- OR configure via JavaScript with additional options -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?v=38"></script>
<script>
  window.addEventListener('load', function() {
    if (window.threedottsWidget) {
      window.threedottsWidget.configure({
        organizationId: 'your-organization-id',
        // Additional configuration options can be added here
      });
    }
  });
</script>`;

  const customizationCode = `<style>
  :root {
    --threedotts-primary-color: #your-brand-color;
    --threedotts-widget-position: bottom-left;
  }
</style>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🤖 ThreeDotts AI Widget
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Embed our conversational AI widget into any website with just one line of code
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-800">
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-blue-900 dark:text-blue-100">Easy Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 dark:text-blue-200">Add the widget to any website with a single script tag</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-200 dark:border-purple-800">
            <CardHeader>
              <Smartphone className="w-8 h-8 text-purple-600" />
              <CardTitle className="text-purple-900 dark:text-purple-100">Responsive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 dark:text-purple-200">Works perfectly on desktop, tablet, and mobile devices</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-800">
            <CardHeader>
              <Palette className="w-8 h-8 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">Customizable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-200">Adapts to your brand colors and website theme</p>
            </CardContent>
          </Card>
        </div>

        {/* Basic Embed Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Basic Embed Code
            </CardTitle>
            <CardDescription>
              Copy and paste this code into your website's HTML to add the widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(embedCode, 'Código básico')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Replace "your-organization-id" with your actual Organization ID. The widget will automatically use your organization's configured ElevenLabs agent and API key.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Advanced Configuration</CardTitle>
            <CardDescription>
              Customize the widget behavior using data attributes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{advancedEmbedCode}</code>
              </pre>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(advancedEmbedCode, 'Código avançado')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Installation Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <span>Get your Organization ID from your dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <span>Set up your ElevenLabs agent ID and API key in organization settings</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <span>Add the script tag to your website's HTML (preferably before closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                <span>Configure your organization ID using the widget API or URL parameters</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                <span>Test the widget on your website</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Live Demo
              <ExternalLink className="w-4 h-4" />
            </CardTitle>
            <CardDescription>
              The widget is currently active on this page! Look for it in the bottom-right corner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Ligar" to start a conversation and test all the features including voice controls.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Configure your organization's ElevenLabs agent ID and API key in the dashboard before using in production. Each organization has its own secure configuration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Customization */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Advanced Customization</CardTitle>
            <CardDescription>
              For advanced customization, you can modify the widget's CSS variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{customizationCode}</code>
              </pre>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(customizationCode, 'Código de customização')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Download Links */}
        <Card>
          <CardHeader>
            <CardTitle>📞 Support & Downloads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => window.open('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Widget Script
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => copyToClipboard('https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script', 'URL do script')}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Script URL
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              For technical support or customization requests, please contact the ThreeDotts team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmbedDemo;