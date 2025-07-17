import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

const Scheduling = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Force iframe reload on component mount
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="w-full bg-background border-b px-4 py-4">
        <Link to="/">
          <Button variant="ghost" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Agende sua Consulta Gratuita
        </h1>
        <p className="text-sm text-muted-foreground">
          Reserve um horário para conversarmos sobre seu projeto.
        </p>
      </div>

      {/* Google Calendar Embed - Full Width */}
      <div className="w-full h-full">
        <iframe 
          ref={iframeRef}
          src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0l1MqdSil-lmX5yQmCndkugzIdzLxO1Ut0BcpZ8Fj04LJpRHtOpltpWjB9P7ahbfoze2Q7ZDyl?gv=true" 
          style={{ border: 0, display: 'block' }} 
          width="100%" 
          height="800"
          frameBorder="0"
          title="Agendamento de Consulta Gratuita"
        />
      </div>
    </div>
  );
};

export default Scheduling;