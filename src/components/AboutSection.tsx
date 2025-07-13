import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Award, 
  Target, 
  Zap,
  ArrowRight 
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Orientado por Missão",
    description: "Entregamos soluções tecnológicas que geram resultados empresariais reais e sucesso mensurável."
  },
  {
    icon: Users,
    title: "Focado no Cliente", 
    description: "Construindo parcerias de longo prazo através de serviço excepcional e suporte contínuo."
  },
  {
    icon: Zap,
    title: "Inovação em Primeiro",
    description: "Mantendo-nos à frente com tecnologias de ponta e estratégias visionárias."
  },
  {
    icon: Award,
    title: "Excelência",
    description: "Mantendo os mais altos padrões em cada projecto que entregamos e serviço que prestamos."
  }
];

const achievements = [
  "Consulta Gratuita",
  "Suporte 24/7", 
  "Sem Taxas Ocultas",
  "Resultados Comprovados"
];

export function AboutSection() {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Liderando o Futuro da 
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2 mb-2 pb-1">
                Inovação Tecnológica
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Em pouco mais de cinco anos, estabelecemo-nos como o parceiro tecnológico 
              que verdadeiramente compreende as necessidades do seu negócio. A nossa equipa dedicada de engenheiros 
              especializados e consultores estratégicos foca-se exclusivamente em entregar soluções personalizadas 
              que geram resultados mensuráveis para empresas prontas para abraçar a transformação digital.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {achievements.map((achievement, index) => (
                <Badge 
                  key={achievement} 
                  variant="secondary" 
                  className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {achievement}
                </Badge>
              ))}
            </div>

            <Button variant="hero" size="lg" className="group">
              Conheça a Nossa História
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <Card 
                key={value.title}
                className="bg-gradient-card border-primary/10 hover:border-primary/20 hover:shadow-elegant transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}