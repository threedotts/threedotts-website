import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Smartphone, Globe, Bot, Cog, BarChart3, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import PhoneInput from "@/components/PhoneInput";
const serviceSchema = z.object({
  // Seção 1: Informações básicas
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email deve ser válido"),
  phone: z.string().regex(/^\+\d{1,4}\d{6,15}$/, "Telefone deve começar com + seguido do código do país e ter formato válido").min(10, "Telefone deve ter pelo menos 10 caracteres"),
  companyDomain: z.string().optional(),
  // Seção 2: Serviços selecionados
  selectedServices: z.array(z.string()).min(1, "Seleccione pelo menos um serviço"),
  // Seção 3: Perguntas específicas por serviço
  // Aplicações Móveis
  appPurpose: z.string().optional(),
  needsUserAccount: z.enum(["sim", "nao", "nao-sei"]).optional(),
  needsOfflineMode: z.enum(["sim", "nao", "nao-sei"]).optional(),
  hasDesignIdentity: z.enum(["sim", "nao", "em-desenvolvimento"]).optional(),
  designFiles: z.array(z.string()).optional(),
  // URLs dos ficheiros de design móvel

  // Websites
  websiteType: z.string().optional(),
  websitePages: z.string().optional(),
  needsLoginPayments: z.enum(["login", "pagamentos", "ambos", "nenhum"]).optional(),
  hasDesignIdeasWeb: z.enum(["sim", "nao", "em-desenvolvimento"]).optional(),
  webDesignFiles: z.array(z.string()).optional(),
  // URLs dos ficheiros de design web

  // Call Center
  supportChannels: z.array(z.string()).optional(),
  otherSupportChannels: z.string().optional(),
  currentSupportMethod: z.string().optional(),
  callCenterObjective: z.string().optional(),
  // Automação
  manualTasks: z.string().optional(),
  automationNeeds: z.array(z.string()).optional(),
  // Soluções Empresariais
  businessProblem: z.string().optional(),
  solutionIdea: z.string().optional(),
  userScope: z.enum(["individual", "pequena-equipe", "equipe", "empresa"]).optional(),
  // Inteligência de Dados
  dataInsights: z.string().optional(),
  currentDataSystems: z.string().optional(),
  needsPredictions: z.enum(["sim", "nao", "nao-sei"]).optional(),
  // Seção 4: Integração entre serviços
  needsIntegration: z.enum(["sim", "nao", "nao-sei"]).optional(),
  integrationDetails: z.string().optional(),
  // Seção 5: Finalização
  additionalInfo: z.string().optional(),
  additionalFiles: z.array(z.string()).optional()
}).superRefine((data, ctx) => {
  // Validação condicional para Aplicações Móveis
  if (data.selectedServices.includes("mobile-apps")) {
    if (!data.appPurpose || data.appPurpose.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appPurpose"],
        message: "Este campo é obrigatório quando Aplicações Móveis está selecionado"
      });
    }
    if (!data.needsUserAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["needsUserAccount"],
        message: "Este campo é obrigatório quando Aplicações Móveis está selecionado"
      });
    }
    if (!data.needsOfflineMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["needsOfflineMode"],
        message: "Este campo é obrigatório quando Aplicações Móveis está selecionado"
      });
    }
    if (!data.hasDesignIdentity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasDesignIdentity"],
        message: "Este campo é obrigatório quando Aplicações Móveis está selecionado"
      });
    }
  }

  // Validação condicional para Websites
  if (data.selectedServices.includes("websites")) {
    if (!data.websiteType || data.websiteType.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["websiteType"],
        message: "Este campo é obrigatório quando Websites está selecionado"
      });
    }
    if (!data.needsLoginPayments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["needsLoginPayments"],
        message: "Este campo é obrigatório quando Websites está selecionado"
      });
    }
    if (!data.hasDesignIdeasWeb) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasDesignIdeasWeb"],
        message: "Este campo é obrigatório quando Websites está selecionado"
      });
    }
  }

  // Validação condicional para Call Center
  if (data.selectedServices.includes("call-center")) {
    if (!data.supportChannels || data.supportChannels.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supportChannels"],
        message: "Seleccione pelo menos um canal quando Call Center está selecionado"
      });
    }
    if (!data.currentSupportMethod || data.currentSupportMethod.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentSupportMethod"],
        message: "Este campo é obrigatório quando Call Center está selecionado"
      });
    }
    if (!data.callCenterObjective || data.callCenterObjective.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["callCenterObjective"],
        message: "Este campo é obrigatório quando Call Center está selecionado"
      });
    }
    // Campo condicional para "Outros" canais
    if (data.supportChannels?.includes("Outros") && (!data.otherSupportChannels || data.otherSupportChannels.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherSupportChannels"],
        message: "Especifique os outros canais"
      });
    }
  }

  // Validação condicional para Automação
  if (data.selectedServices.includes("automation")) {
    if (!data.manualTasks || data.manualTasks.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualTasks"],
        message: "Este campo é obrigatório quando Automação está selecionado"
      });
    }
    if (!data.automationNeeds || data.automationNeeds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["automationNeeds"],
        message: "Seleccione pelo menos uma necessidade quando Automação está selecionado"
      });
    }
  }

  // Validação condicional para Soluções Empresariais
  if (data.selectedServices.includes("business-solutions")) {
    if (!data.businessProblem || data.businessProblem.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessProblem"],
        message: "Este campo é obrigatório quando Soluções Empresariais está selecionado"
      });
    }
    if (!data.userScope) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userScope"],
        message: "Este campo é obrigatório quando Soluções Empresariais está selecionado"
      });
    }
  }

  // Validação condicional para Inteligência de Dados
  if (data.selectedServices.includes("data-intelligence")) {
    if (!data.dataInsights || data.dataInsights.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataInsights"],
        message: "Este campo é obrigatório quando Inteligência de Dados está selecionado"
      });
    }
    if (!data.needsPredictions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["needsPredictions"],
        message: "Este campo é obrigatório quando Inteligência de Dados está selecionado"
      });
    }
  }

  // Validação condicional para integração (apenas se múltiplos serviços)
  if (data.selectedServices.length > 1) {
    if (!data.needsIntegration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["needsIntegration"],
        message: "Este campo é obrigatório quando múltiplos serviços são selecionados"
      });
    }
    // Campo condicional para detalhes de integração
    if (data.needsIntegration === "sim" && (!data.integrationDetails || data.integrationDetails.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["integrationDetails"],
        message: "Forneça detalhes sobre a integração"
      });
    }
  }
});
type ServiceFormData = z.infer<typeof serviceSchema>;
const services = [{
  id: "mobile-apps",
  title: "Aplicações Móveis para o Seu Negócio",
  icon: Smartphone
}, {
  id: "websites",
  title: "Websites Profissionais e Sistemas Online",
  icon: Globe
}, {
  id: "call-center",
  title: "Call Center e Atendimento ao Cliente com IA",
  icon: Headphones
}, {
  id: "automation",
  title: "Poupe Tempo com Automação IA",
  icon: Bot
}, {
  id: "business-solutions",
  title: "Soluções Empresariais Personalizadas",
  icon: Cog
}, {
  id: "data-intelligence",
  title: "Inteligência de Dados e Insights Empresariais",
  icon: BarChart3
}];
const supportChannelOptions = ["Telefone", "WhatsApp", "Facebook", "E-mail", "SMS", "Website", "Outros"];
const automationOptions = ["Relatórios automáticos", "Leitura de documentos", "Gerenciamento de estoque", "Outros"];
export default function ProjectRequest() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      selectedServices: [],
      supportChannels: [],
      automationNeeds: [],
      designFiles: [],
      webDesignFiles: []
    }
  });
  const selectedServices = form.watch("selectedServices") || [];
  const hasMultipleServices = selectedServices.length > 1;
  const onSubmit = async (data: ServiceFormData) => {
    try {
      console.log("Form data:", data);
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Entraremos em contacto consigo em breve para discutir o seu projeto."
      });

      // Aqui integrar com Supabase para salvar os dados
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  const renderRadioGroup = (field: any, options: {
    value: string;
    label: string;
  }[]) => <div className="space-y-3">
      {options.map(option => <div key={option.value} className={cn("flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200", field.value === option.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/30")} onClick={() => field.onChange(option.value)}>
          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors", field.value === option.value ? "border-primary bg-primary" : "border-muted-foreground")}>
            {field.value === option.value && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
          </div>
          <Label className="text-sm font-normal cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>)}
    </div>;
  return <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Solicitar Novo Projeto
          </h1>
          <p className="text-muted-foreground text-lg">
            Responda às perguntas abaixo para recebermos uma proposta personalizada para o seu projeto.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Seção 1: Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Estas informações nos ajudam a manter tudo organizado e entrar em contacto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="fullName" render={({
                field
              }) => <FormItem>
                      <FormLabel>Qual é o seu nome? *</FormLabel>
                      <FormControl>
                        <Input placeholder="O seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="companyName" render={({
                field
              }) => <FormItem>
                      <FormLabel>Qual é o nome da sua empresa ou projeto? *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa ou projeto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="phone" render={({
                field
              }) => <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <PhoneInput 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          placeholder="+351 123 456 789"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="companyDomain" render={({
                field
              }) => <FormItem>
                      <FormLabel>Domínio da empresa (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="www.exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </CardContent>
            </Card>

            {/* Seção 2: Seleção de Serviços */}
            <Card>
              <CardHeader>
                <CardTitle>Quais serviços deseja? *</CardTitle>
                <CardDescription>
                  Seleccione um ou mais serviços que precisa para o seu projecto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="selectedServices" render={() => <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map(service => <FormField key={service.id} control={form.control} name="selectedServices" render={({
                    field
                  }) => {
                    const isSelected = field.value?.includes(service.id);
                    return <FormItem className="space-y-0">
                                  <FormControl>
                                    <div className={cn("relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg group", isSelected ? "border-primary bg-gradient-to-br from-primary/10 to-primary/20 shadow-lg ring-2 ring-primary/20" : "border-border hover:border-primary/50 hover:shadow-md")} onClick={() => {
                          const currentValue = field.value || [];
                          if (isSelected) {
                            field.onChange(currentValue.filter((value: string) => value !== service.id));
                          } else {
                            field.onChange([...currentValue, service.id]);
                          }
                        }}>
                                      {/* Checkbox overlay */}
                                      <div className="absolute top-3 right-3">
                                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground group-hover:border-primary")}>
                                          {isSelected && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>}
                                        </div>
                                      </div>
                                      
                                      {/* Service content */}
                                      <div className="flex items-start space-x-4">
                                        <div className={cn("p-3 rounded-lg transition-all duration-200", isSelected ? "bg-primary text-primary-foreground shadow-md scale-110" : "bg-muted group-hover:bg-primary/20 group-hover:scale-105")}>
                                          <service.icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                          <h3 className={cn("font-semibold text-base mb-1 transition-colors", isSelected ? "text-primary font-bold" : "text-foreground group-hover:text-primary")}>
                                            {service.title}
                                          </h3>
                                        </div>
                                      </div>
                                    </div>
                                  </FormControl>
                                </FormItem>;
                  }} />)}
                      </div>
                      <FormMessage />
                    </FormItem>} />
              </CardContent>
            </Card>

            {/* Seção 3: Perguntas Específicas por Serviço */}
            
            {/* Aplicações Móveis */}
            {selectedServices.includes("mobile-apps") && <Card>
                <CardHeader>
                  <CardTitle>Aplicações Móveis para o Seu Negócio</CardTitle>
                  <CardDescription>
                    Algumas perguntas específicas sobre a sua aplicação móvel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="appPurpose" render={({
                field
              }) => <FormItem>
                        <FormLabel>O que deseja que a aplicação faça para o utilizador?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Ex.: pedir produtos, acompanhar compras — para entendermos o objetivo.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Descreva as principais funcionalidades..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="needsUserAccount" render={({
                field
              }) => <FormItem>
                        <FormLabel>Os utilizadores vão precisar de criar conta?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para saber se o app precisa de login.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, vão precisar de conta"
                  }, {
                    value: "nao",
                    label: "Não, pode ser usado sem conta"
                  }, {
                    value: "nao-sei",
                    label: "Não sei ainda"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="needsOfflineMode" render={({
                field
              }) => <FormItem>
                        <FormLabel>Deseja que a aplicação funcione mesmo sem internet?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para planejar uso offline.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, precisa funcionar offline"
                  }, {
                    value: "nao",
                    label: "Não, só precisa funcionar online"
                  }, {
                    value: "nao-sei",
                    label: "Não sei ainda"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="hasDesignIdentity" render={({
                field
              }) => <FormItem>
                        <FormLabel>Já tem logo, cores ou estilo definido?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para combinar o visual com sua marca.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, já tenho tudo definido"
                  }, {
                    value: "em-desenvolvimento",
                    label: "Tenho algumas ideias, mas não está completo"
                  }, {
                    value: "nao",
                    label: "Não, preciso de ajuda com o design"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  {/* Campo para ficheiros de design móvel */}
                  {form.watch("hasDesignIdentity") === "sim" && <FormField control={form.control} name="designFiles" render={({
                field
              }) => <FormItem>
                          <FormControl>
                            <FileUpload label="Ficheiros de design da aplicação móvel" description="Carregue logos, mockups, guias de estilo, etc. (máx. 10MB por ficheiro)" onFileUpload={urls => field.onChange(urls)} maxFiles={5} acceptedFileTypes="image/*,.pdf,.ai,.psd,.sketch,.fig,.zip,.rar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />}
                </CardContent>
              </Card>}

            {/* Websites */}
            {selectedServices.includes("websites") && <Card>
                <CardHeader>
                  <CardTitle>Websites Profissionais e Sistemas Online</CardTitle>
                  <CardDescription>
                    Vamos entender melhor o seu projecto web.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="websiteType" render={({
                field
              }) => <FormItem>
                        <FormLabel>Que tipo de site deseja?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Ex.: site informativo, loja online, sistema de reservas, portal de clientes — para definir o escopo.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Descreva o tipo de website..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="websitePages" render={({
                field
              }) => <FormItem>
                        <FormLabel>Quais páginas precisa?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Ex.: Início, Sobre, Contacto, Loja — para planejar o conteúdo.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Liste as páginas necessárias..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="needsLoginPayments" render={({
                field
              }) => <FormItem>
                        <FormLabel>Vai ter registo, login ou pagamentos no site?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para saber se precisamos dessas funções.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "login",
                    label: "Só login/registo"
                  }, {
                    value: "pagamentos",
                    label: "Só pagamentos"
                  }, {
                    value: "ambos",
                    label: "Login e pagamentos"
                  }, {
                    value: "nenhum",
                    label: "Nenhum dos dois"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="hasDesignIdeasWeb" render={({
                field
              }) => <FormItem>
                        <FormLabel>Já tem logo, cores ou ideias de design?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para manter identidade visual.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, já tenho tudo definido"
                  }, {
                    value: "em-desenvolvimento",
                    label: "Tenho algumas ideias"
                  }, {
                    value: "nao",
                    label: "Não, preciso de ajuda"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  {/* Campo para ficheiros de design web */}
                  {form.watch("hasDesignIdeasWeb") === "sim" && <FormField control={form.control} name="webDesignFiles" render={({
                field
              }) => <FormItem>
                          <FormControl>
                            <FileUpload label="Ficheiros de design do website" description="Carregue logos, mockups, guias de estilo, etc. (máx. 10MB por ficheiro)" onFileUpload={urls => field.onChange(urls)} maxFiles={5} acceptedFileTypes="image/*,.pdf,.ai,.psd,.sketch,.fig,.zip,.rar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />}
                </CardContent>
              </Card>}
            {selectedServices.includes("call-center") && <Card>
                <CardHeader>
                  <CardTitle>Call Center e Atendimento ao Cliente com IA</CardTitle>
                  <CardDescription>
                    Vamos configurar o melhor atendimento para o seu negócio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nota sobre a plataforma Threedotts */}
                  <div className="p-4 bg-muted/20 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Terá acesso à plataforma Threedotts para gerir o seu call center, onde pode configurar todas as funcionalidades necessárias.
                    </p>
                  </div>

                   <FormField control={form.control} name="supportChannels" render={() => <FormItem>
                         <FormLabel>Quer atendimento por telefone, WhatsApp, Facebook, e-mail, SMS ou Website?</FormLabel>
                         <FormDescription className="text-sm text-muted-foreground">O nosso sistema de call center pode ser integrado em qualquer plataforma que desejar - seja WhatsApp Business, sistemas CRM, websites, ou qualquer outra ferramenta que utilize.</FormDescription>
                        <div className="space-y-3">
                          {supportChannelOptions.map(channel => <FormField key={channel} control={form.control} name="supportChannels" render={({
                    field
                  }) => {
                    const isChecked = field.value?.includes(channel);
                    return <div className={cn("flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200", isChecked ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/30")} onClick={() => {
                      const currentValue = field.value || [];
                      if (isChecked) {
                        field.onChange(currentValue.filter((value: string) => value !== channel));
                      } else {
                        field.onChange([...currentValue, channel]);
                      }
                    }}>
                                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-colors", isChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
                                      {isChecked && <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>}
                                    </div>
                                    <Label className="text-sm font-normal cursor-pointer flex-1">
                                      {channel}
                                    </Label>
                                  </div>;
                  }} />)}
                        </div>
                        <FormMessage />
                      </FormItem>} />

                   {/* Mostrar campo de texto para "Outros" canais */}
                   {form.watch("supportChannels")?.includes("Outros") && <FormField control={form.control} name="otherSupportChannels" render={({
                field
              }) => <FormItem>
                           <FormLabel>Especifique outros canais de atendimento</FormLabel>
                           <FormDescription className="text-sm text-muted-foreground">
                             Quais outros canais deseja usar para o atendimento?
                           </FormDescription>
                           <FormControl>
                             <Textarea placeholder="Ex.: Telegram, Discord, sistema próprio, etc..." {...field} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>} />}

                   <FormField control={form.control} name="callCenterObjective" render={({
                field
              }) => <FormItem>
                         <FormLabel>Qual é o principal objectivo do seu call center?</FormLabel>
                         <FormDescription className="text-sm text-muted-foreground">
                           Ex.: vendas, suporte técnico, apoio ao cliente, agendamento, etc.
                         </FormDescription>
                         <FormControl>
                           <Textarea placeholder="Descreva o objectivo principal do call center..." {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>} />

                   <FormField control={form.control} name="currentSupportMethod" render={({
                field
              }) => <FormItem>
                         <FormLabel>Como atende os seus clientes hoje?</FormLabel>
                         <FormDescription className="text-sm text-muted-foreground">
                           Para entender a situação atual e melhorar o atendimento.
                         </FormDescription>
                         <FormControl>
                           <Textarea placeholder="Ex.: Atendemos por telefone das 9h às 18h com 2 pessoas, também respondemos WhatsApp manualmente, e-mails chegam mas às vezes demoram para responder..." {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>} />

                </CardContent>
              </Card>}

            {/* Automação */}
            {selectedServices.includes("automation") && <Card>
                <CardHeader>
                  <CardTitle>Poupe Tempo com Automação IA</CardTitle>
                  <CardDescription>
                    Vamos automatizar processos para sua empresa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="manualTasks" render={({
                field
              }) => <FormItem>
                        <FormLabel>Quais tarefas manuais faz hoje e quer automatizar?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ex.: Envio de relatórios diários por email, processamento manual de facturas, agendamento de reuniões, gestão de inventário..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                </CardContent>
              </Card>}

            {/* Soluções Empresariais */}
            {selectedServices.includes("business-solutions") && <Card>
                <CardHeader>
                  <CardTitle>Soluções Empresariais Personalizadas</CardTitle>
                  <CardDescription>
                    Vamos entender o problema que deseja resolver.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="businessProblem" render={({
                field
              }) => <FormItem>
                        <FormLabel>Que problema específico deseja resolver com esse software?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva o problema ou desafio..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="solutionIdea" render={({
                field
              }) => <FormItem>
                        <FormLabel>Tem alguma ideia ou exemplo de como quer que funcione?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva sua ideia ou cite exemplos..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="userScope" render={({
                field
              }) => <FormItem>
                        <FormLabel>Quantas pessoas vão usar este software?</FormLabel>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "individual",
                    label: "Somente eu"
                  }, {
                    value: "pequena-equipe",
                    label: "Pequena equipe (1-10 pessoas)"
                  }, {
                    value: "equipe",
                    label: "Equipe média (10-50 pessoas)"
                  }, {
                    value: "empresa",
                    label: "Toda a empresa (50+ pessoas)"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </CardContent>
              </Card>}

            {/* Inteligência de Dados */}
            {selectedServices.includes("data-intelligence") && <Card>
                <CardHeader>
                  <CardTitle>Inteligência de Dados e Insights Empresariais</CardTitle>
                  <CardDescription>
                    Vamos entender que tipo de análise precisa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="dataInsights" render={({
                field
              }) => <FormItem>
                        <FormLabel>Que tipo de informação deseja ver?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Ex.: vendas, comportamento dos clientes, desempenho — para direcionar a análise.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Descreva que dados e insights precisa..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="currentDataSystems" render={({
                field
              }) => <FormItem>
                        <FormLabel>Já coleta dados ou usa algum sistema hoje?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para saber de onde começamos.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Descreva os sistemas e dados que já tem..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="needsPredictions" render={({
                field
              }) => <FormItem>
                        <FormLabel>Quer previsões ou relatórios automáticos?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para montar painéis úteis.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, quero previsões e relatórios automáticos"
                  }, {
                    value: "nao",
                    label: "Não, só análise dos dados atuais"
                  }, {
                    value: "nao-sei",
                    label: "Não sei ainda"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </CardContent>
              </Card>}

            {/* Seção 4: Integração entre serviços */}
            {hasMultipleServices && <Card>
                <CardHeader>
                  <CardTitle>Integração entre Serviços</CardTitle>
                  <CardDescription>
                    Como seleccionou múltiplos serviços, vamos ver se eles devem trabalhar juntos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="needsIntegration" render={({
                field
              }) => <FormItem>
                        <FormLabel>Deseja que esses serviços funcionem juntos (mesmo login, dados integrados)?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Para planejar integração.
                        </FormDescription>
                        <FormControl>
                          {renderRadioGroup(field, [{
                    value: "sim",
                    label: "Sim, quero que funcionem integrados"
                  }, {
                    value: "nao",
                    label: "Não, podem ser separados"
                  }, {
                    value: "nao-sei",
                    label: "Não sei ainda"
                  }])}
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  {form.watch("needsIntegration") === "sim" && <FormField control={form.control} name="integrationDetails" render={({
                field
              }) => <FormItem>
                        <FormLabel>Existe alguma funcionalidade que precisa acontecer em conjunto entre eles?</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Como sincronização ou relatórios cruzados.
                        </FormDescription>
                        <FormControl>
                          <Textarea placeholder="Descreva como os serviços devem trabalhar juntos..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />}
                </CardContent>
              </Card>}

            {/* Seção 5: Finalização */}
            <Card>
              <CardHeader>
                <CardTitle>Finalização e Extras</CardTitle>
                <CardDescription>
                  Últimas informações para completarmos o seu pedido.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="additionalInfo" render={({
                field
              }) => <FormItem>
                      <FormLabel>Tem mais algo que gostaria de nos falar sobre o seu projecto?</FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Espaço livre para detalhar aspectos específicos ou requisitos especiais do seu projeto.
                      </FormDescription>
                      <FormControl>
                        <Textarea placeholder="Qualquer informação adicional, ideias, dúvidas ou comentários..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="additionalFiles" render={({
                field
              }) => <FormItem>
                      <FormControl>
                        <FileUpload 
                          label="Documentos, Imagens e Arquivos Extras" 
                          description="Envie qualquer arquivo relevante: logos, rascunhos, exemplos, planilhas, imagens, documentos (máx. 10MB por ficheiro)" 
                          onFileUpload={(urls) => field.onChange(urls)} 
                          maxFiles={10} 
                          acceptedFileTypes="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.ai,.psd,.sketch,.fig" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
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
    </div>;
}