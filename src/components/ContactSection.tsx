import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  ArrowRight 
} from "lucide-react";

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

const contactInfo = [
  {
    icon: Mail,
    title: "Envie-nos um Email",
    content: "suporte@threedotts.co.mz",
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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Input sanitization - preserve spaces during typing, only trim on validation
  const sanitizeInput = (value: string) => {
    return value.replace(/[<>]/g, ""); // Remove only dangerous HTML characters, keep spaces
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Email inválido";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear previous errors and perform real-time validation
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));

    // Real-time validation for better UX
    if (value.trim()) {
      let error = "";
      
      switch (name) {
        case "firstName":
        case "lastName":
        case "company":
          if (value.trim().length < 2) {
            error = `${name === "firstName" ? "Primeiro nome" : 
                      name === "lastName" ? "Último nome" : 
                      "Nome da empresa"} deve ter pelo menos 2 caracteres`;
          }
          break;
        case "email":
          error = validateEmail(value.trim());
          break;
        case "message":
          if (value.trim().length < 10) {
            error = "Mensagem deve ter pelo menos 10 caracteres";
          } else if (value.trim().length > 1000) {
            error = "Mensagem deve ter no máximo 1000 caracteres";
          }
          break;
      }
      
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all inputs
    const newErrors: Record<string, string> = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Primeiro nome é obrigatório";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "Primeiro nome deve ter pelo menos 2 caracteres";
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Último nome é obrigatório";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Último nome deve ter pelo menos 2 caracteres";
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else {
      const emailError = validateEmail(formData.email.trim());
      if (emailError) {
        newErrors.email = emailError;
      }
    }
    
    // Company validation
    if (!formData.company.trim()) {
      newErrors.company = "Nome da empresa é obrigatório";
    } else if (formData.company.trim().length < 2) {
      newErrors.company = "Nome da empresa deve ter pelo menos 2 caracteres";
    }
    
    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Mensagem é obrigatória";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Mensagem deve ter pelo menos 10 caracteres";
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = "Mensagem deve ter no máximo 1000 caracteres";
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: {
          ...formData,
          timestamp: new Date().toISOString(),
          source: 'contact_form',
          webhookUrl: 'https://n8n.srv922768.hstgr.cloud/webhook/bca4e21a-2d74-485e-8e46-5f7238ca0b7a'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Erro ao enviar mensagem",
          description: error.message || "Erro interno do servidor.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Mensagem enviada!",
        description: "Obrigado pelo seu contacto. Responderemos em breve.",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
      });

    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Primeiro Nome *
                    </label>
                    <Input 
                      name="firstName"
                      placeholder="João" 
                      className="border-primary/20 focus:border-primary"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Último Nome *
                    </label>
                    <Input 
                      name="lastName"
                      placeholder="Silva" 
                      className="border-primary/20 focus:border-primary"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email *
                  </label>
                  <Input 
                    name="email"
                    type="email" 
                    placeholder="joao@empresa.com" 
                    className="border-primary/20 focus:border-primary"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Empresa *
                  </label>
                  <Input 
                    name="company"
                    placeholder="A Sua Empresa" 
                    className="border-primary/20 focus:border-primary"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.company && <p className="text-sm text-destructive mt-1">{errors.company}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Mensagem *
                  </label>
                  <Textarea 
                    name="message"
                    placeholder="Conte-nos sobre os requisitos do seu projecto..."
                    className="min-h-[120px] border-primary/20 focus:border-primary"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                </div>
                
                <Button 
                  type="submit"
                  variant="hero" 
                  size="lg" 
                  className="w-full group"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* CTA Banner */}
        <div className="mt-20 text-center bg-gradient-primary rounded-2xl p-6 sm:p-8 md:p-12 mx-4 sm:mx-0 animate-fade-in">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Pronto para Transformar o Seu Negócio?
          </h3>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Dê o primeiro passo rumo à transformação digital. Vamos discutir o seu projecto e criar soluções que geram resultados reais para o seu negócio.
          </p>
          <Link to="/scheduling">
            <Button 
              variant="secondary" 
              size="lg" 
              className="group w-full sm:w-auto px-4 sm:px-6"
            >
              <span className="truncate">Agende Consulta Gratuita</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform ml-2 flex-shrink-0" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}