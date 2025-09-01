import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Scheduling = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back button */}
      <div className="w-full bg-background border-b px-4 py-4">
        <Link to="/">
          <Button variant="ghost" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>
      </div>

      {/* Google Calendar Iframe - Full Height */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto py-8 flex-1 flex flex-col">
          <h1 className="text-3xl font-bold text-center mb-8">Agende a Sua Consulta</h1>
          <div className="flex-1 bg-card rounded-lg shadow-lg overflow-hidden">
            <iframe 
              src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ03epljbaei6jPZ2HxQMy0gI1-mPI_PpWILcLcSGtBgTnzdlW3_dusq9GU2alg6-_1cNo2hZREu?gv=true" 
              style={{ border: 0 }} 
              width="100%" 
              height="100%" 
              frameBorder="0"
              title="Calendário de Agendamento Threedotts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;