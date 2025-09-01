import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Scheduling = () => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header with back button - takes space at top */}
      <div className="bg-background border-b px-4 py-2 flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </Link>
      </div>

      {/* Full-height iframe */}
      <iframe 
        src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ03epljbaei6jPZ2HxQMy0gI1-mPI_PpWILcLcSGtBgTnzdlW3_dusq9GU2alg6-_1cNo2hZREu?gv=true" 
        style={{ border: 0 }} 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="Calendário de Agendamento Threedotts"
        className="flex-1"
      />
    </div>
  );
};

export default Scheduling;