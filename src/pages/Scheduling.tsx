import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Scheduling = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Agende sua Consulta Gratuita
          </h1>
          <p className="text-lg text-muted-foreground">
            Reserve um horário para conversarmos sobre seu projeto e como podemos ajudar a transformar suas ideias em realidade.
          </p>
        </div>

        {/* Google Calendar Embed */}
        <div className="bg-background rounded-lg shadow-lg p-4 md:p-6">
          <iframe 
            src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0l1MqdSil-lmX5yQmCndkugzIdzLxO1Ut0BcpZ8Fj04LJpRHtOpltpWjB9P7ahbfoze2Q7ZDyl?gv=true" 
            style={{ border: 0 }} 
            width="100%" 
            height="600" 
            frameBorder="0"
            title="Agendamento de Consulta Gratuita"
          />
        </div>
      </div>
    </div>
  );
};

export default Scheduling;