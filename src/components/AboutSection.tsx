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
    title: "Mission-Driven",
    description: "Delivering technology solutions that drive real business outcomes and measurable success."
  },
  {
    icon: Users,
    title: "Client-Focused", 
    description: "Building long-term partnerships through exceptional service and continuous support."
  },
  {
    icon: Zap,
    title: "Innovation First",
    description: "Staying ahead with cutting-edge technologies and forward-thinking strategies."
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Maintaining the highest standards in every project we deliver and service we provide."
  }
];

const achievements = [
  "ISO 27001 Certified",
  "Microsoft Gold Partner", 
  "AWS Advanced Partner",
  "Industry Awards Winner"
];

export function AboutSection() {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Leading the Future of 
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                Technology Innovation
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              With over a decade of experience in the technology sector, we've evolved from a 
              small startup to a trusted partner for businesses worldwide. Our team of expert 
              engineers, consultants, and strategists work tirelessly to deliver solutions 
              that transform how organizations operate in the digital landscape.
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
              Learn Our Story
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