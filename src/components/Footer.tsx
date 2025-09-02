import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const footerSections = [
  {
    title: "Serviços",
    links: [
      { name: "Agendamento", href: "/scheduling" },
      { name: "Pedido de Projeto", href: "/project-request" }
    ]
  },
  {
    title: "Plataforma",
    links: [
      { name: "Dashboard", href: "/dashboard" }
    ]
  }
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Instagram, href: "#", label: "Instagram" }
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('newsletter-signup', {
        body: { email }
      });

      if (error) throw error;

      toast.success("Email subscrito com sucesso!");
      setEmail("");
    } catch (error) {
      console.error('Erro ao subscrever newsletter:', error);
      toast.error("Erro ao subscrever newsletter. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-xl font-bold">Threedotts</span>
            </div>
            
            <p className="text-background/80 mb-6 leading-relaxed">
              Transformando negócios através de soluções tecnológicas que resolvem problemas reais, 
              poupam tempo e promovem crescimento com mais de 5 anos de serviço dedicado.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-background/80">
                <Mail className="w-4 h-4" />
                <span>suporte@threedotts.co.mz</span>
              </div>
              <div className="flex items-center space-x-3 text-background/80">
                <Phone className="w-4 h-4" />
                <span>+258 87 611 0005</span>
              </div>
              <div className="flex items-center space-x-3 text-background/80">
                <MapPin className="w-4 h-4" />
                <span>Quinta Avenida Minguene, Costa do Sol</span>
              </div>
            </div>

            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className="text-background/80 hover:text-background hover:bg-background/10"
                  asChild
                >
                  <a href={social.href} aria-label={social.label}>
                    <social.icon className="w-5 h-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4 text-background">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-background/80 hover:text-background transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/20 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-background">
                Mantenha-se Actualizado
              </h3>
              <p className="text-background/80">
                Receba as últimas novidades e actualizações tecnológicas na sua caixa de entrada.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Insira o seu email"
                className="flex-1 sm:w-64 px-4 py-2 rounded-md bg-background/10 border border-background/20 text-background placeholder-background/60 focus:outline-none focus:border-primary min-w-0"
                required
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                variant="default" 
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Subscrever"}
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 pt-8 mt-8 text-center">
          <p className="text-background/60">
            © {new Date().getFullYear()} Threedotts. Todos os direitos reservados. | Política de Privacidade | Termos de Serviço
          </p>
        </div>
      </div>
    </footer>
  );
}