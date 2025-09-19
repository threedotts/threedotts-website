import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Declare window.calendar for TypeScript
declare global {
  interface Window {
    calendar?: {
      schedulingButton: {
        load: (config: {
          url: string;
          color: string;
          label: string;
          target: HTMLElement;
        }) => void;
      };
    };
  }
}

export default function Scheduling() {
  const navigate = useNavigate();
  usePageTitle("Agendar Consulta - Threedotts");

  useEffect(() => {
    // Load Cal.com script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize Cal.com embed after script loads
      if (window.calendar?.schedulingButton) {
        const calendarElement = document.getElementById('calendar-embed');
        if (calendarElement) {
          window.calendar.schedulingButton.load({
            url: 'https://cal.com/threedotts/30min',
            color: 'hsl(var(--primary))',
            label: 'Agendar Consulta',
            target: calendarElement
          });
        }
      }
    };
    
    document.head.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
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
            Agendar Consulta Gratuita
          </h1>
          <p className="text-muted-foreground text-lg">
            Reserve 30 minutos para discutir o seu projeto e receber orientação especializada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Information Section */}
          <div className="space-y-6">
            <Card className="border-primary/10 shadow-elegant bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  O Que Esperar
                </CardTitle>
                <CardDescription>
                  Durante a nossa consulta gratuita, vamos:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Analisar o Seu Projeto</h4>
                    <p className="text-sm text-muted-foreground">
                      Compreender os seus objectivos e requisitos específicos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Discutir Soluções</h4>
                    <p className="text-sm text-muted-foreground">
                      Apresentar as melhores abordagens tecnológicas para o seu negócio
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Proposta Personalizada</h4>
                    <p className="text-sm text-muted-foreground">
                      Fornecer um orçamento detalhado e cronograma realista
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Próximos Passos</h4>
                    <p className="text-sm text-muted-foreground">
                      Definir um plano de acção claro para implementação
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Details */}
            <Card className="border-primary/10 shadow-elegant bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Detalhes da Reunião
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Duração</h4>
                    <p className="text-sm text-muted-foreground">30 minutos</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Formato</h4>
                    <p className="text-sm text-muted-foreground">Videochamada (Google Meet/Zoom)</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Disponibilidade</h4>
                    <p className="text-sm text-muted-foreground">Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Embed Section */}
          <div className="space-y-6">
            <Card className="border-primary/10 shadow-elegant bg-gradient-card">
              <CardHeader>
                <CardTitle>Escolha o Melhor Horário</CardTitle>
                <CardDescription>
                  Seleccione uma data e hora que funcione melhor para si.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Cal.com embed container */}
                <div 
                  id="calendar-embed" 
                  className="min-h-[400px] flex items-center justify-center bg-muted/30 rounded-lg"
                >
                  <div className="text-center p-8">
                    <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      A carregar calendário de agendamento...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Se o calendário não carregar, contacte-nos directamente em:{" "}
                      <a 
                        href="mailto:suporte@threedotts.co.mz" 
                        className="text-primary hover:underline"
                      >
                        suporte@threedotts.co.mz
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Contact */}
            <Card className="border-primary/10 shadow-elegant bg-gradient-card">
              <CardHeader>
                <CardTitle>Preferê Contacto Directo?</CardTitle>
                <CardDescription>
                  Pode também entrar em contacto connosco directamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-medium">@</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a 
                        href="mailto:suporte@threedotts.co.mz" 
                        className="text-primary hover:underline font-medium"
                      >
                        suporte@threedotts.co.mz
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-medium">📞</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <a 
                        href="tel:+258876110005" 
                        className="text-primary hover:underline font-medium"
                      >
                        +258 87 611 0005
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}