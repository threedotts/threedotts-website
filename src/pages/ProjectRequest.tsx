import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Smartphone, Globe, Bot, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";

const serviceSchema = z.object({
  // Informações básicas
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos"),
  company: z.string().optional(),
  
  // Tipo de serviço
  serviceType: z.enum(["mobile-app", "web-app", "ai-agent", "automation"], {
    required_error: "Selecione um tipo de serviço",
  }),
  
  // Detalhes do projeto
  projectTitle: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  projectDescription: z.string().min(50, "Descrição deve ter pelo menos 50 caracteres"),
  
  // Orçamento
  budget: z.enum(["5k-15k", "15k-30k", "30k-50k", "50k+", "to-discuss"], {
    required_error: "Selecione uma faixa de orçamento",
  }),
  
  // Prazo
  timeline: z.enum(["1-month", "2-3-months", "3-6-months", "6+ months", "flexible"], {
    required_error: "Selecione um prazo",
  }),
  
  // Funcionalidades específicas por tipo de serviço
  mobileFeatures: z.array(z.string()).optional(),
  webFeatures: z.array(z.string()).optional(),
  aiFeatures: z.array(z.string()).optional(),
  automationFeatures: z.array(z.string()).optional(),
  
  // Integrações necessárias
  integrations: z.array(z.string()).optional(),
  
  // Informações adicionais
  hasExistingSystem: z.boolean().default(false),
  existingSystemDetails: z.string().optional(),
  targetAudience: z.string().optional(),
  specialRequirements: z.string().optional(),
  
  // Preferências de comunicação
  preferredContact: z.enum(["email", "phone", "whatsapp", "video-call"], {
    required_error: "Selecione forma de contacto preferida",
  }),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const serviceOptions = [
  { value: "mobile-app", label: "Aplicação Móvel", icon: Smartphone, description: "Apps iOS e Android" },
  { value: "web-app", label: "Aplicação Web", icon: Globe, description: "Websites e aplicações web" },
  { value: "ai-agent", label: "Agente de IA", icon: Bot, description: "Chatbots e assistentes inteligentes" },
  { value: "automation", label: "Automação", icon: Cog, description: "Soluções de automação de processos" },
];

const mobileFeatureOptions = [
  "Autenticação de utilizadores",
  "Notificações push",
  "Chat em tempo real",
  "Pagamentos integrados",
  "Geolocalização",
  "Câmara/Galeria",
  "Modo offline",
  "Integração com redes sociais",
  "Analytics",
  "Multi-idioma",
];

const webFeatureOptions = [
  "Sistema de gestão de conteúdo",
  "E-commerce",
  "Dashboard administrativo",
  "Sistema de utilizadores",
  "API REST",
  "Base de dados",
  "Sistema de pagamentos",
  "Chat ao vivo",
  "SEO otimizado",
  "Responsivo",
];

const aiFeatureOptions = [
  "Processamento de linguagem natural",
  "Reconhecimento de voz",
  "Análise de sentimentos",
  "Integração com OpenAI/ChatGPT",
  "Aprendizagem automática",
  "Visão computacional",
  "Recomendações personalizadas",
  "Análise preditiva",
];

const automationFeatureOptions = [
  "Automação de emails",
  "Integração com CRM",
  "Automação de redes sociais",
  "Processamento de documentos",
  "Integração com APIs externas",
  "Workflows automatizados",
  "Relatórios automáticos",
  "Sincronização de dados",
];

export default function ProjectRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("");

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      hasExistingSystem: false,
      mobileFeatures: [],
      webFeatures: [],
      aiFeatures: [],
      automationFeatures: [],
      integrations: [],
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      console.log("Form data:", data);
      
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Entraremos em contacto consigo em breve para discutir o seu projeto.",
      });
      
      // Aqui você integraria com o backend/Supabase para salvar os dados
      
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const getFeatureOptions = () => {
    switch (selectedService) {
      case "mobile-app":
        return { options: mobileFeatureOptions, field: "mobileFeatures" };
      case "web-app":
        return { options: webFeatureOptions, field: "webFeatures" };
      case "ai-agent":
        return { options: aiFeatureOptions, field: "aiFeatures" };
      case "automation":
        return { options: automationFeatureOptions, field: "automationFeatures" };
      default:
        return { options: [], field: "" };
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Solicitar Novo Projeto
          </h1>
          <p className="text-muted-foreground text-lg">
            Preencha o formulário abaixo com os detalhes do seu projeto para recebermos uma proposta personalizada.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contacto</CardTitle>
                <CardDescription>
                  As suas informações de contacto para podermos responder à sua solicitação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="O seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seuemail@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+351 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da sua empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Serviço */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Serviço</CardTitle>
                <CardDescription>
                  Selecione o tipo de serviço que melhor se adequa ao seu projeto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedService(value);
                          }}
                          value={field.value}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {serviceOptions.map((service) => (
                            <div key={service.value}>
                              <RadioGroupItem
                                value={service.value}
                                id={service.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={service.value}
                                className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 peer-checked:ring-2 peer-checked:ring-primary peer-checked:bg-primary/5"
                              >
                                <service.icon className="h-6 w-6 text-primary" />
                                <div>
                                  <div className="font-medium">{service.label}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {service.description}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Detalhes do Projeto */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Projeto</CardTitle>
                <CardDescription>
                  Descreva o seu projeto em detalhe para podermos compreender melhor as suas necessidades.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Projeto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: App de delivery de comida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Detalhada *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o seu projeto, objetivos, público-alvo e qualquer informação relevante..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mínimo 50 caracteres. Quanto mais detalhe, melhor poderemos ajudar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Funcionalidades Específicas */}
            {selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidades Desejadas</CardTitle>
                  <CardDescription>
                    Selecione as funcionalidades que gostaria de incluir no seu projeto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name={getFeatureOptions().field as any}
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getFeatureOptions().options.map((feature) => (
                            <FormField
                              key={feature}
                              control={form.control}
                              name={getFeatureOptions().field as any}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(feature)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, feature]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter((value: string) => value !== feature)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {feature}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Orçamento e Prazo */}
            <Card>
              <CardHeader>
                <CardTitle>Orçamento e Prazo</CardTitle>
                <CardDescription>
                  Indique o seu orçamento disponível e prazo desejado para o projeto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orçamento Disponível *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma faixa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5k-15k">€5.000 - €15.000</SelectItem>
                            <SelectItem value="15k-30k">€15.000 - €30.000</SelectItem>
                            <SelectItem value="30k-50k">€30.000 - €50.000</SelectItem>
                            <SelectItem value="50k+">€50.000+</SelectItem>
                            <SelectItem value="to-discuss">A discutir</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo Desejado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um prazo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-month">1 mês</SelectItem>
                            <SelectItem value="2-3-months">2-3 meses</SelectItem>
                            <SelectItem value="3-6-months">3-6 meses</SelectItem>
                            <SelectItem value="6+ months">6+ meses</SelectItem>
                            <SelectItem value="flexible">Flexível</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
                <CardDescription>
                  Forneça informações adicionais que possam ser relevantes para o projeto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasExistingSystem"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Tenho um sistema existente que precisa de integração
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasExistingSystem") && (
                  <FormField
                    control={form.control}
                    name="existingSystemDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalhes do Sistema Existente</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o sistema existente, tecnologias utilizadas, etc..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Público-Alvo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Empresas de 50-200 funcionários"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos Especiais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Regulamentações específicas, certificações necessárias, etc..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Contacto Preferida *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="video-call">Videochamada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button type="submit" size="lg" className="w-full md:w-auto">
                <Send className="mr-2 h-4 w-4" />
                Enviar Solicitação
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}