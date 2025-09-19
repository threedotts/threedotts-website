import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useGoogleAuthCallback } from "@/hooks/useGoogleAuthCallback";

// Configuration for ThreeDots widget
const CHAT_WIDGET_ENABLED = true;

import Index from "./pages/Index";
import ServiceDetails from "./pages/ServiceDetails";
import ProjectRequest from "./pages/ProjectRequest";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Scheduling from "./pages/Scheduling";
import Billing from "./pages/Billing";
import CreateOrganization from "./pages/CreateOrganization";
import NotFound from "./pages/NotFound";
import AcceptInvitation from "./pages/AcceptInvitation";
import EmbedDemo from "./pages/EmbedDemo";
import { ChatWidgetErrorBoundary } from "./components/ChatWidgetErrorBoundary";
import { SecurityHeaders } from "./components/SecurityHeaders";
import { OrganizationMemberListener } from "./components/OrganizationMemberListener";
import ThreeDotsEmbeddedConvai from "./components/ThreeDotsEmbeddedConvai";

const queryClient = new QueryClient();

// ThreeDots embedded convai widget component
const ThreeDotsWidget = () => {
  return CHAT_WIDGET_ENABLED ? (
    <ChatWidgetErrorBoundary>
      <ThreeDotsEmbeddedConvai />
    </ChatWidgetErrorBoundary>
  ) : null;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Enable session timeout only for authenticated users
  useSessionTimeout(isAuthenticated);
  
  // Handle Google OAuth callback for organization creation
  useGoogleAuthCallback();

  useEffect(() => {
    // Monitor authentication state for security logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      // Log security events (logging disabled)
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/project-request" element={<ProjectRequest />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard/*" element={
              <OrganizationMemberListener>
                <Dashboard />
              </OrganizationMemberListener>
            } />
            <Route path="/create-organization" element={<CreateOrganization />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/service/:serviceId" element={<ServiceDetails />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/embed-demo" element={<EmbedDemo />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* ThreeDots embedded convai widget - global and persistent */}
        <ThreeDotsWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
