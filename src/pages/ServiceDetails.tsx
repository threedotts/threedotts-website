import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Globe, 
  Bot, 
  Zap, 
  Code2, 
  Brain,
  ArrowLeft,
  Check,
  Star,
  Clock,
  Users
} from "lucide-react";

const servicesData = {
  mobile: {
    id: "mobile",
    icon: Smartphone,
    title: "Aplicações Móveis para o Seu Negócio",
    subtitle: "Chegue aos seus clientes em qualquer lugar",
    description: "Criamos aplicações móveis personalizadas que funcionam perfeitamente em todos os dispositivos, oferecendo uma experiência excepcional aos seus clientes e aumentando o alcance do seu negócio.",
    fullDescription: "No mundo digital de hoje, ter uma presença móvel forte é essencial para qualquer negócio. As nossas aplicações móveis são desenvolvidas com as mais recentes tecnologias e focam na experiência do utilizador, garantindo que os seus clientes tenham acesso fácil e rápido aos seus serviços.",
    features: [
      "Aplicações Android nativas e híbridas",
      "Aplicações iPhone/iOS otimizadas",
      "Interface intuitiva e fácil de usar",
      "Integração com sistemas existentes",
      "Notificações push personalizadas",
      "Funcionalidades offline",
      "Segurança avançada de dados",
      "Atualizações automáticas"
    ],
    benefits: [
      "Aumento da fidelização de clientes",
      "Maior alcance de mercado",
      "Vendas 24/7 através do mobile",
      "Melhor comunicação com clientes",
      "Análise detalhada de comportamento"
    ],
    process: [
      "Análise e planeamento do projeto",
      "Design UI/UX personalizado",
      "Desenvolvimento e testes",
      "Lançamento nas app stores",
      "Suporte e manutenção contínua"
    ],
    timeline: "4-8 semanas",
    price: "Desde 125.000 MT"
  },
  web: {
    id: "web",
    icon: Globe,
    title: "Websites Profissionais e Sistemas Online",
    subtitle: "A sua presença digital profissional",
    description: "Websites modernos e plataformas online que o ajudam a vender mais, servir melhor os clientes e fazer crescer o seu negócio de forma sustentável.",
    fullDescription: "Um website profissional é a base de qualquer estratégia digital bem-sucedida. Criamos websites responsivos, rápidos e otimizados para motores de busca que convertem visitantes em clientes.",
    features: [
      "Websites responsivos e modernos",
      "Lojas online completas (e-commerce)",
      "Portais de clientes personalizados",
      "Sistemas de reservas online",
      "CMS fácil de gerir",
      "Otimização SEO incluída",
      "Integração com redes sociais",
      "Analytics e relatórios detalhados"
    ],
    benefits: [
      "Presença online profissional",
      "Vendas online automatizadas",
      "Melhor posicionamento no Google",
      "Gestão eficiente de clientes",
      "Redução de custos operacionais"
    ],
    process: [
      "Estratégia digital e planeamento",
      "Design e prototipagem",
      "Desenvolvimento e integração",
      "Testes e otimização",
      "Lançamento e formação"
    ],
    timeline: "3-6 semanas",
    price: "Desde 75.000 MT"
  },
  ai: {
    id: "ai",
    icon: Bot,
    title: "Soluções de Atendimento ao Cliente com IA",
    subtitle: "Atendimento 24/7 inteligente",
    description: "Chatbots inteligentes e soluções de call center que atendem os seus clientes 24 horas por dia, 7 dias por semana, com respostas rápidas e precisas.",
    fullDescription: "Revolucione o atendimento ao cliente com inteligência artificial. Os nossos chatbots aprendem com cada interação e oferecem respostas cada vez mais precisas, melhorando continuamente a experiência do cliente.",
    features: [
      "Chatbots inteligentes multicanal",
      "Processamento de linguagem natural",
      "Integração com WhatsApp, Facebook, site",
      "Call center virtual automatizado",
      "Respostas instantâneas 24/7",
      "Escalamento para humanos quando necessário",
      "Base de conhecimento dinâmica",
      "Análise de sentimentos dos clientes"
    ],
    benefits: [
      "Redução de 80% no tempo de resposta",
      "Disponibilidade 24/7 sem custos extra",
      "Aumento da satisfação do cliente",
      "Redução de custos operacionais",
      "Dados valiosos sobre clientes"
    ],
    process: [
      "Análise do fluxo de atendimento atual",
      "Configuração da base de conhecimento",
      "Treino do chatbot com dados reais",
      "Integração com sistemas existentes",
      "Monitorização e otimização contínua"
    ],
    timeline: "2-4 semanas",
    price: "Desde 40.000 MT/mês"
  },
  automation: {
    id: "automation",
    icon: Zap,
    title: "Poupe Tempo com Automação IA",
    subtitle: "Automatize tarefas repetitivas",
    description: "Pare de perder tempo com tarefas manuais repetitivas. Automatizamos processos do seu negócio para que se possa focar no que realmente importa.",
    fullDescription: "A automação inteligente transforma a forma como trabalha. Identificamos processos repetitivos no seu negócio e criamos soluções automatizadas que poupam horas de trabalho manual todos os dias.",
    features: [
      "Geração automática de relatórios",
      "Processamento inteligente de documentos",
      "Gestão automatizada de inventário",
      "Automatização de emails e comunicações",
      "Sincronização entre sistemas",
      "Alertas inteligentes personalizados",
      "Backup automático de dados",
      "Integração com ferramentas existentes"
    ],
    benefits: [
      "Poupança de 5-10 horas por semana",
      "Redução de erros humanos",
      "Maior produtividade da equipa",
      "Processos mais consistentes",
      "Foco em tarefas de maior valor"
    ],
    process: [
      "Auditoria de processos atuais",
      "Identificação de oportunidades",
      "Desenvolvimento de automações",
      "Testes e refinamento",
      "Implementação e formação"
    ],
    timeline: "2-5 semanas",
    price: "Desde 60.000 MT"
  },
  custom: {
    id: "custom",
    icon: Code2,
    title: "Soluções Empresariais Personalizadas",
    subtitle: "Software feito à medida do seu negócio",
    description: "Cada negócio é único. Criamos software completamente personalizado que se adequa exatamente à forma como trabalha e às suas necessidades específicas.",
    fullDescription: "Quando as soluções standard não chegam, criamos software completamente personalizado. Analisamos profundamente o seu negócio e desenvolvemos ferramentas que se adaptam perfeitamente aos seus processos únicos.",
    features: [
      "Análise detalhada dos seus processos",
      "Software desenvolvido de raiz",
      "Interface adaptada à sua equipa",
      "Integração com sistemas existentes",
      "Escalabilidade garantida",
      "Formação completa da equipa",
      "Suporte técnico dedicado",
      "Atualizações e melhorias contínuas"
    ],
    benefits: [
      "Solução 100% adequada ao seu negócio",
      "Vantagem competitiva única",
      "Processos otimizados e eficientes",
      "ROI mensurável e significativo",
      "Propriedade total do software"
    ],
    process: [
      "Descoberta e análise profunda",
      "Arquitetura e planeamento técnico",
      "Desenvolvimento iterativo",
      "Testes com utilizadores reais",
      "Implementação e go-live"
    ],
    timeline: "8-16 semanas",
    price: "Desde 250.000 MT"
  },
  analytics: {
    id: "analytics",
    icon: Brain,
    title: "Inteligência de Dados e Insights Empresariais",
    subtitle: "Dados que geram resultados",
    description: "Transforme os dados do seu negócio em insights claros e acionáveis que o ajudam a tomar melhores decisões e prever tendências futuras.",
    fullDescription: "Os dados são o novo petróleo, mas só têm valor quando transformados em insights acionáveis. Criamos dashboards inteligentes e sistemas de análise que revelam padrões ocultos no seu negócio.",
    features: [
      "Dashboards interativos em tempo real",
      "Previsão de vendas com IA",
      "Análise de comportamento do cliente",
      "Relatórios automáticos personalizados",
      "KPIs e métricas relevantes",
      "Análise de tendências de mercado",
      "Segmentação avançada de clientes",
      "Alertas inteligentes de oportunidades"
    ],
    benefits: [
      "Decisões baseadas em dados reais",
      "Identificação de oportunidades de crescimento",
      "Otimização de campanhas de marketing",
      "Prevenção de problemas antes que aconteçam",
      "Aumento da rentabilidade"
    ],
    process: [
      "Auditoria dos dados disponíveis",
      "Definição de KPIs importantes",
      "Desenvolvimento de dashboards",
      "Implementação de análises preditivas",
      "Formação e acompanhamento"
    ],
    timeline: "3-7 semanas",
    price: "Desde 100.000 MT"
  }
};

const ServiceDetails = () => {
  const { serviceId } = useParams();
  const service = serviceId ? servicesData[serviceId as keyof typeof servicesData] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Serviço não encontrado</h1>
          <Link to="/#services">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos serviços
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero border-b border-primary/10 py-8">
        <div className="container mx-auto px-4">
          <Link 
            to="/#services"
            onClick={() => {
              // Small delay to ensure navigation happens first
              setTimeout(() => {
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                  servicesSection.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
          >
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos serviços
            </Button>
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <service.icon className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {service.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {service.subtitle}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {service.timeline}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {service.price}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre este serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {service.fullDescription}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>O que inclui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Process */}
            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.process.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Benefícios principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Pronto para começar?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 mb-4 text-sm">
                  Agende uma conversa gratuita para discutir o seu projeto.
                </p>
                <Button variant="secondary" className="w-full">
                  Contactar agora
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prazo estimado</span>
                    <Badge variant="outline">{service.timeline}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Investimento</span>
                    <Badge variant="outline">{service.price}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;