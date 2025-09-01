import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Scheduling = () => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Header with back button - fixed position */}
      <div className="absolute top-0 left-0 z-10 bg-background/90 backdrop-blur-sm border-b px-4 py-2">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>
      </div>

      {/* Full-screen iframe */}
      <iframe 
        src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ03epljbaei6jPZ2HxQMy0gI1-mPI_PpWILcLcSGtBgTnzdlW3_dusq9GU2alg6-_1cNo2hZREu?gv=true" 
        style={{ border: 0 }} 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="Calendário de Agendamento Threedotts"
        className="w-full h-full"
      />
    </div>
  );
};

export default Scheduling;