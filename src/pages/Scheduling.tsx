import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEffect } from "react";

const Scheduling = () => {
  usePageTitle("Agendamento");
  
  useEffect(() => {
    // Load ThreeDotts widget script
    const script = document.createElement('script');
    script.src = 'https://dkqzzypemdewomxrjftv.supabase.co/functions/v1/widget-script?organizationId=1e926240-b303-444b-9f8c-57abd9fa657b';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);
  
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