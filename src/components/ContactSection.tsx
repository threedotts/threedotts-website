import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  ArrowRight 
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Envie-nos um Email",
    content: "suporte@threedotts.com",
    description: "Envie-nos um email a qualquer hora"
  },
  {
    icon: Phone,
    title: "Ligue-nos",
    content: "+258 87 611 0005",
    description: "Seg-Sex das 8h às 18h"
  },
  {
    icon: MapPin,
    title: "Visite-nos",
    content: "Quinta Avenida Minguene, Costa do Sol",
    description: "A localização da nossa sede"
  },
  {
    icon: Clock,
    title: "Horário de Suporte",
    content: "Disponível 24/7",
    description: "Assistência 24 horas por dia"
  }
];

export function ContactSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Pronto para <span className="bg-gradient-primary bg-clip-text text-transparent">Começar?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Vamos discutir como podemos ajudar a transformar o seu negócio com as soluções tecnológicas certas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h3 className="text-2xl font-semibold text-foreground mb-6">
                Entre em Contacto
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Tem perguntas sobre os nossos serviços ou quer discutir o seu projecto? 
                Adoraríamos ouvir de si. Entre em contacto através de qualquer um dos canais abaixo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <Card 
                  key={info.title}
                  className="border-primary/10 hover:border-primary/20 hover:shadow-elegant transition-all duration-300 bg-gradient-card animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 pl-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {info.title}
                        </h4>
                        <p className="text-sm font-medium text-primary mb-1">
                          {info.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="border-primary/10 shadow-elegant bg-gradient-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground">
                Envie-nos uma Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Primeiro Nome
                  </label>
                  <Input placeholder="João" className="border-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Último Nome
                  </label>
                  <Input placeholder="Silva" className="border-primary/20 focus:border-primary" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <Input 
                  type="email" 
                  placeholder="joao@empresa.com" 
                  className="border-primary/20 focus:border-primary" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Empresa
                </label>
                <Input placeholder="A Sua Empresa" className="border-primary/20 focus:border-primary" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mensagem
                </label>
                <Textarea 
                  placeholder="Conte-nos sobre os requisitos do seu projecto..."
                  className="min-h-[120px] border-primary/20 focus:border-primary"
                />
              </div>
              
              <Button variant="hero" size="lg" className="w-full group">
                <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CTA Banner */}
        <div className="mt-20 text-center bg-gradient-primary rounded-2xl p-12 animate-fade-in">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Pronto para Transformar o Seu Negócio?
          </h3>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Dê o primeiro passo rumo à transformação digital. Vamos discutir o seu projecto e criar soluções que geram resultados reais para o seu negócio.
          </p>
          <Button variant="secondary" size="lg" className="group">
            Agende Consulta Gratuita
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}