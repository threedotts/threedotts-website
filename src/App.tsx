import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string;
      };
    }
  }
}

// Configuration for third-party integrations
const ELEVENLABS_AGENT_ID = "agent_01k02ete3tfjgrq97y8a7v541y";
const CHAT_WIDGET_ENABLED = import.meta.env.VITE_CHAT_WIDGET_ENABLED !== "false";
import Index from "./pages/Index";
import ServiceDetails from "./pages/ServiceDetails";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ChatWidgetErrorBoundary } from "./components/ChatWidgetErrorBoundary";
import { SecurityHeaders } from "./components/SecurityHeaders";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Enable session timeout for authenticated users
  useSessionTimeout();

  useEffect(() => {
    // Monitor authentication state for security logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      // Log security events
      if (event === 'SIGNED_IN') {
        console.log('[SECURITY] User signed in at:', new Date().toISOString());
      } else if (event === 'SIGNED_OUT') {
        console.log('[SECURITY] User signed out at:', new Date().toISOString());
      }
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/service/:serviceId" element={<ServiceDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* Conditionally render chat widget with proper error boundary */}
        {CHAT_WIDGET_ENABLED && ELEVENLABS_AGENT_ID && (
          <ChatWidgetErrorBoundary>
            <div className="elevenlabs-chat-wrapper">
              <elevenlabs-convai agent-id={ELEVENLABS_AGENT_ID}></elevenlabs-convai>
            </div>
          </ChatWidgetErrorBoundary>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
