import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Code, Palette, Smartphone, Zap } from 'lucide-react';
import { toast } from "sonner";
import { useEffect } from 'react';

const EmbedDemo = () => {
  // Add embedded widget script to this page for testing
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="widget-script"]')) {
      return;
    }

    console.log('🔧 Loading widget script for embed demo...');
    
    // Create and load widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?v=29';
    script.onload = () => {
      console.log('✅ Widget script loaded, configuring...');
      // Configure widget when loaded
      setTimeout(() => {
        if ((window as any).threedottsWidget) {
          (window as any).threedottsWidget.configure({
            agentId: 'agent_01k02ete3tfjgrq97y8a7v541y'
          });
          console.log('✅ Embed demo widget configured!');
        } else {
          console.error('❌ Widget not found after loading script');
        }
      }, 100);
    };
    script.onerror = () => {
      console.error('❌ Failed to load widget script');
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

  const embedCode = `<!-- ThreeDotts AI Widget -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?v=27"></script>
<script>
  // Configure the agent ID
  window.addEventListener('load', function() {
    if (window.threedottsWidget) {
      window.threedottsWidget.configure({
        agentId: 'YOUR_AGENT_ID'
      });
    }
  });
</script>`;

  const advancedEmbedCode = `<!-- Alternative: Use URL parameter -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script"></script>
<!-- Make sure your page URL includes: yoursite.com?agentId=YOUR_AGENT_ID -->

<!-- OR configure via JavaScript -->
<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script"></script>
<script>
  // Wait for the widget to load, then configure
  window.addEventListener('load', function() {
    if (window.threedottsWidget) {
      window.threedottsWidget.configure({
        agentId: 'YOUR_AGENT_ID'
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
              <code>{`<script src="https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?v=39"></script>
<script>
  // Configure the widget with your agent ID
  window.threedottsWidget.configure({
    agentId: "YOUR_AGENT_ID_HERE"
  });
</script>`}</code>
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
                <strong>Note:</strong> Replace "YOUR_AGENT_ID" with your actual ElevenLabs agent ID. The agentId can be set via JavaScript configuration or by adding ?agentId=YOUR_AGENT_ID to your page URL.
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
                <span>Get your ElevenLabs agent ID from your dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <span>Add the script tag to your website's HTML (preferably before closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <span>Configure your agent ID using the widget API or URL parameters</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">4</span>
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
                <strong>Important:</strong> Make sure to configure your ElevenLabs agent ID and WebSocket endpoints before using in production.
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