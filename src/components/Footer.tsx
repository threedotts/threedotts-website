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

const footerSections = [
  {
    title: "Services",
    links: [
      "Cloud Solutions",
      "Cybersecurity", 
      "Custom Development",
      "Data Analytics",
      "Mobile Solutions",
      "IT Consulting"
    ]
  },
  {
    title: "Company",
    links: [
      "About Us",
      "Our Team",
      "Careers",
      "News & Updates",
      "Case Studies",
      "Partners"
    ]
  },
  {
    title: "Support",
    links: [
      "Help Center",
      "Documentation",
      "Contact Support",
      "System Status",
      "Security",
      "Privacy Policy"
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
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-foreground rounded-sm" />
              </div>
              <span className="text-xl font-bold">TechFlow</span>
            </div>
            
            <p className="text-background/80 mb-6 leading-relaxed">
              Empowering businesses with innovative technology solutions that drive growth, 
              efficiency, and digital transformation in an ever-evolving landscape.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-background/80">
                <Mail className="w-4 h-4" />
                <span>hello@techflow.com</span>
              </div>
              <div className="flex items-center space-x-3 text-background/80">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-background/80">
                <MapPin className="w-4 h-4" />
                <span>123 Tech Street, Silicon Valley, CA</span>
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
                  <li key={link}>
                    <a 
                      href="#" 
                      className="text-background/80 hover:text-background transition-colors"
                    >
                      {link}
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
                Stay Updated
              </h3>
              <p className="text-background/80">
                Get the latest technology insights and updates delivered to your inbox.
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 rounded-md bg-background/10 border border-background/20 text-background placeholder-background/60 focus:outline-none focus:border-primary"
              />
              <Button variant="default">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 pt-8 mt-8 text-center">
          <p className="text-background/60">
            © 2024 TechFlow. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
}