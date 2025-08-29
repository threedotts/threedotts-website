import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Scheduling = () => {
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
      </div>

      {/* Google Calendar Iframe */}
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Agende a Sua Consulta</h1>
          <div className="bg-card rounded-lg shadow-lg p-4">
            <iframe 
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Africa%2FMaputo&showPrint=0&title=Threedotts&src=Y185NTM4YmZjZjYyYTQwMDFmNTlkN2VkNTA4OTM1ZmYyMDM2MWQ2MGVjMzVjMWZkYjNjZmJhNGU4ZWNkMThhOWQzQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23c0ca33" 
              style={{ borderWidth: 0 }} 
              width="100%" 
              height="600" 
              frameBorder="0" 
              scrolling="no"
              title="Calendário de Agendamento Threedotts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;