import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PlayCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Demo = () => {
  const navigate = useNavigate();
  
  usePageTitle("Demo - Teste do Agente");

  useEffect(() => {
    // Load ThreeDotts widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Demo do Agente IA
          </h1>
          <p className="text-muted-foreground text-lg">
            Experimente as capacidades do nosso agente conversacional de inteligência artificial.
          </p>
        </div>

        {/* Demo Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Demonstração Interativa
            </CardTitle>
            <CardDescription>
              Veja como o nosso agente IA pode transformar o atendimento ao cliente da sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Demo Disponível em Breve</h3>
                <p className="text-muted-foreground">
                  Estamos a preparar uma demonstração interativa completa do nosso agente IA. 
                  Entre em contacto connosco para uma demonstração personalizada.
                </p>
                <Button variant="default" onClick={() => navigate("/project-request")} className="mt-4">
                  Solicitar Demonstração
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Características do Agente IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Capacidades Avançadas:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Processamento de linguagem natural</li>
                  <li>• Respostas contextuais inteligentes</li>
                  <li>• Integração com sistemas empresariais</li>
                  <li>• Suporte multilíngue</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Benefícios para o Negócio:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Atendimento 24/7 automatizado</li>
                  <li>• Redução de custos operacionais</li>
                  <li>• Melhoria na satisfação do cliente</li>
                  <li>• Escalabilidade instantânea</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Demo;