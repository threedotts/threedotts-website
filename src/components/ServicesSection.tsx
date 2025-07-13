import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Smartphone, 
  Globe, 
  Bot, 
  Zap, 
  Code2, 
  Brain,
  ArrowRight 
} from "lucide-react";

const services = [
  {
    icon: Smartphone,
    title: "Aplicações Móveis para o Seu Negócio",
    description: "Chegue aos seus clientes em qualquer lugar com aplicações móveis personalizadas que funcionam perfeitamente em todos os telemóveis e tablets.",
    features: ["Aplicações Android", "Aplicações iPhone", "Interface Fácil de Usar"]
  },
  {
    icon: Globe,
    title: "Websites Profissionais e Sistemas Online",
    description: "Websites bonitos e plataformas online que o ajudam a vender mais, servir melhor os clientes e fazer crescer o seu negócio.",
    features: ["Lojas Online", "Portais de Clientes", "Sistemas de Reservas"]
  },
  {
    icon: Bot,
    title: "Soluções de Atendimento ao Cliente com IA",
    description: "Atenda perguntas dos clientes 24/7 com chatbots inteligentes e serviços profissionais de call center que nunca dormem.",
    features: ["Suporte de Chat 24/7", "Call Centers Profissionais", "Respostas Instantâneas ao Cliente"]
  },
  {
    icon: Zap,
    title: "Poupe Tempo com Automação IA",
    description: "Pare de fazer tarefas repetitivas manualmente. Automatizamos o seu trabalho diário para se focar no crescimento do negócio.",
    features: ["Geração Automática de Relatórios", "Processamento Inteligente de Documentos", "Gestão de Inventário"]
  },
  {
    icon: Code2,
    title: "Soluções Empresariais Personalizadas",
    description: "Cada negócio é único. Criamos software personalizado que se adequa exactamente à forma como trabalha e ao que precisa.",
    features: ["Construído Só para Si", "Formação Fácil da Equipa", "Cresce com o Seu Negócio"]
  },
  {
    icon: Brain,
    title: "Inteligência de Dados e Insights Empresariais",
    description: "Transforme os dados do seu negócio em insights claros que o ajudam a tomar melhores decisões e prever tendências futuras.",
    features: ["Previsão de Vendas", "Análise de Comportamento do Cliente", "Relatórios de Desempenho"]
  }
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Os Nossos <span className="bg-gradient-primary bg-clip-text text-transparent">Serviços</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Resolvemos problemas empresariais reais com soluções inteligentes que lhe poupam tempo, aumentam vendas e ajudam a servir melhor os clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="group hover:shadow-elegant transition-all duration-300 bg-gradient-card border-primary/10 hover:border-primary/20 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="group/btn px-4 py-2 h-auto text-primary bg-muted/50 hover:bg-muted/70 hover:text-primary/80 rounded-md">
                  Saber Mais
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="group">
            Discuta o Seu Projecto
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}