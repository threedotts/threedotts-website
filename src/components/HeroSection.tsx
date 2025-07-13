import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-tech.jpg";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax Background Image */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
          scale: `${1 + scrollY * 0.0002}`
        }}
      >
        <img 
          src={heroImage} 
          alt="Technology Background" 
          className="w-full h-[120%] object-cover opacity-60"
          style={{ minHeight: '120vh' }}
          onError={(e) => {
            console.error('Hero image failed to load:', e);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => console.log('Hero image loaded successfully')}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-background/70 via-background/60 to-background/70" />
      
      {/* Secondary Parallax Layer */}
      <div 
        className="absolute inset-0 z-20 bg-gradient-hero opacity-60"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />

      {/* Floating Elements with Parallax */}
      <div 
        className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`
        }}
      />
      <div 
        className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full animate-float"
        style={{ 
          animationDelay: '2s',
          transform: `translateY(${scrollY * 0.15}px)`
        }}
      />
      <div 
        className="absolute bottom-32 left-1/4 w-16 h-16 bg-primary/10 rounded-full animate-float"
        style={{ 
          animationDelay: '4s',
          transform: `translateY(${scrollY * 0.25}px)`
        }}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 z-30 text-center max-w-4xl relative">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Your Technology
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Partner for Success
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            We deliver cutting-edge IT solutions that transform businesses, streamline operations, 
            and drive innovation in the digital age.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="hero" size="lg" className="group">
              Get Started Today
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button variant="premium" size="lg" className="group">
              <Play className="group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Projects Completed</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </div>
            <div className="animate-scale-in col-span-2 md:col-span-1" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}