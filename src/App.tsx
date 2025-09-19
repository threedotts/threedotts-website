import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import ServiceDetails from "./pages/ServiceDetails";
import ProjectRequest from "./pages/ProjectRequest";
import NotFound from "./pages/NotFound";
import EmbedDemo from "./pages/EmbedDemo";
import { SecurityHeaders } from "./components/SecurityHeaders";

const App = () => {

  return (
    <TooltipProvider>
      <SecurityHeaders />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/project-request" element={<ProjectRequest />} />
          <Route path="/service/:serviceId" element={<ServiceDetails />} />
          <Route path="/embed-demo" element={<EmbedDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
