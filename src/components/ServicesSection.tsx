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
    title: "Mobile App Development",
    description: "Native iOS and Android apps, plus cross-platform solutions that deliver exceptional user experiences and performance.",
    features: ["iOS & Android Native", "React Native", "Flutter Development"]
  },
  {
    icon: Globe,
    title: "Web Applications",
    description: "Modern, responsive web applications built with cutting-edge frameworks to scale with your business needs.",
    features: ["React & Next.js", "Progressive Web Apps", "E-commerce Solutions"]
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "Intelligent AI-powered agents that automate customer service, data processing, and complex business workflows.",
    features: ["Chatbots & Virtual Assistants", "NLP Processing", "Custom AI Models"]
  },
  {
    icon: Zap,
    title: "Process Automation",
    description: "Streamline operations with intelligent automation solutions that reduce manual work and increase efficiency.",
    features: ["Workflow Automation", "API Integration", "RPA Solutions"]
  },
  {
    icon: Code2,
    title: "Custom Software",
    description: "Tailored software solutions designed specifically for your business requirements and industry needs.",
    features: ["Enterprise Software", "System Integration", "Legacy Modernization"]
  },
  {
    icon: Brain,
    title: "AI & Machine Learning",
    description: "Advanced AI solutions including predictive analytics, computer vision, and intelligent data processing.",
    features: ["Machine Learning Models", "Data Analytics", "Computer Vision"]
  }
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our <span className="bg-gradient-primary bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From mobile apps to AI agents, we deliver innovative technology solutions that drive business growth and digital transformation.
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
                <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:text-primary">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="group">
            Discuss Your Project
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}