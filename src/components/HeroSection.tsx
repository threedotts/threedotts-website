import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import heroImage from "@/assets/hero-ai.jpg";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-background/70 via-background/60 to-background/70" />

      {/* Floating Elements with Blur */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-float backdrop-blur-md border border-primary/30" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-accent/15 rounded-full animate-float backdrop-blur-lg border border-accent/20" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-primary/25 rounded-full animate-float backdrop-blur-sm border border-primary/40" style={{ animationDelay: '4s' }} />
      
      {/* Additional Floating Shapes */}
      <div className="absolute top-1/3 left-1/3 w-12 h-12 bg-secondary/20 rounded-lg animate-float backdrop-blur-md rotate-45 border border-secondary/30" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-muted/15 rounded-full animate-float backdrop-blur-lg border border-muted/25" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 right-10 w-14 h-14 bg-primary/15 rounded-full animate-float backdrop-blur-md border border-primary/25" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-20 left-1/2 w-18 h-18 bg-accent/20 rounded-lg animate-float backdrop-blur-sm rotate-12 border border-accent/30" style={{ animationDelay: '6s' }} />
      <div className="absolute top-60 left-1/5 w-10 h-10 bg-secondary/25 rounded-full animate-float backdrop-blur-md border border-secondary/35" style={{ animationDelay: '1.5s' }} />

      {/* Main Content */}
      <div className="container mx-auto px-4 z-20 text-center max-w-4xl relative">
        <div className="animate-fade-in py-8">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-8 leading-relaxed py-4">
            Transform Your Business
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              With Smart Technology
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Threedotts specializes in mobile apps, web applications, AI agents, and automation solutions 
            that streamline your operations and accelerate digital transformation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="hero" size="lg" className="group">
              Start Your Project
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="premium" size="lg" className="group">
              <Play className="group-hover:scale-110 transition-transform" />
              View Our Work
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5+</div>
              <div className="text-muted-foreground">Years Experience</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Development Support</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}