import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import CustomElevenLabsWidget from './CustomElevenLabsWidget';

const CustomWidgetDemo: React.FC = () => {
  const { toast } = useToast();
  const [showWidget, setShowWidget] = useState(false);
  const [agentId, setAgentId] = useState('agent_01k02ete3tfjgrq97y8a7v541y'); // Default from your network requests
  const [apiKey, setApiKey] = useState('');

  const handleStartDemo = () => {
    if (!agentId.trim()) {
      toast({
        title: "Agent ID Obrigatório",
        description: "Por favor, insira um Agent ID válido",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key Obrigatória",
        description: "Por favor, insira sua chave da API ElevenLabs",
        variant: "destructive",
      });
      return;
    }

    setShowWidget(true);
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
  };

  if (showWidget) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <CustomElevenLabsWidget
          agentId={agentId}
          apiKey={apiKey}
          onClose={handleCloseWidget}
          className="bg-background shadow-xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Widget ElevenLabs Personalizado</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure seu agente de IA conversacional usando WebSockets
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agent_xxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Encontre seu Agent ID no painel da ElevenLabs
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Sua chave privada da API ElevenLabs
            </p>
          </div>

          <Button onClick={handleStartDemo} className="w-full">
            Iniciar Widget
          </Button>

          <div className="bg-muted p-3 rounded text-xs">
            <h4 className="font-medium mb-2">Funcionalidades:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Conexão WebSocket em tempo real</li>
              <li>• Gravação e reprodução de áudio</li>
              <li>• Envio de mensagens de texto</li>
              <li>• Indicadores de status visuais</li>
              <li>• Controle completo da conversa</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomWidgetDemo;