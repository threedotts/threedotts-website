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
    title: "Mobile Apps for Your Business",
    description: "Reach your customers anywhere with custom mobile apps that work perfectly on all phones and tablets.",
    features: ["Android Apps", "iPhone Apps", "Easy to Use Interface"]
  },
  {
    icon: Globe,
    title: "Professional Websites & Online Systems",
    description: "Beautiful websites and online platforms that help you sell more, serve customers better, and grow your business.",
    features: ["Online Stores", "Customer Portals", "Booking Systems"]
  },
  {
    icon: Bot,
    title: "Smart Customer Service Solutions",
    description: "Handle customer questions 24/7 with intelligent chatbots and professional call center services that never sleep.",
    features: ["24/7 Live Chat Support", "Professional Call Centers", "Instant Customer Responses"]
  },
  {
    icon: Zap,
    title: "Save Time with Smart Automation",
    description: "Stop doing repetitive tasks manually. We automate your daily work so you can focus on growing your business.",
    features: ["Automatic Report Generation", "Email & SMS Automation", "Inventory Management"]
  },
  {
    icon: Code2,
    title: "Tailored Business Solutions",
    description: "Every business is unique. We create custom software that fits exactly how you work and what you need.",
    features: ["Built Just for You", "Easy Team Training", "Grows with Your Business"]
  },
  {
    icon: Brain,
    title: "Data Intelligence & Business Insights",
    description: "Turn your business data into clear insights that help you make better decisions and predict future trends.",
    features: ["Sales Forecasting", "Customer Behavior Analysis", "Performance Reports"]
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
            We solve real business problems with smart solutions that save you time, increase sales, and help you serve customers better.
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
                <Button variant="ghost" className="group/btn p-2 h-auto text-primary hover:text-primary/80 hover:bg-transparent">
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