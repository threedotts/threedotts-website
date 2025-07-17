import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SchedulingForm from "@/components/SchedulingForm";

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

      {/* Custom Scheduling Form */}
      <div className="container mx-auto py-8">
        <SchedulingForm />
      </div>
    </div>
  );
};

export default Scheduling;