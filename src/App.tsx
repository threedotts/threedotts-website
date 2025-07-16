import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
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

// Widget component that uses React Router navigation
const ElevenLabsWidget = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up ElevenLabs widget client tools
    if (CHAT_WIDGET_ENABLED && ELEVENLABS_AGENT_ID) {
      const handleWidgetCall = (event: CustomEvent) => {
        event.detail.config.clientTools = {
          redirectToExternalURL: ({ url }: { url: string }) => {
            console.log('redirectToExternalURL called with url:', url);
            
            // Navigate using React Router without page refresh
            navigate(url);
          },
        };
      };

      // Wait for widget to be available and add event listener
      const addEventListenerWhenReady = () => {
        const widget = document.querySelector('elevenlabs-convai');
        if (widget) {
          widget.addEventListener('elevenlabs-convai:call', handleWidgetCall as EventListener);
        } else {
          // Retry after a short delay if widget is not ready
          setTimeout(addEventListenerWhenReady, 100);
        }
      };

      addEventListenerWhenReady();

      return () => {
        const widget = document.querySelector('elevenlabs-convai');
        if (widget) {
          widget.removeEventListener('elevenlabs-convai:call', handleWidgetCall as EventListener);
        }
      };
    }
  }, [navigate]);

  return CHAT_WIDGET_ENABLED && ELEVENLABS_AGENT_ID ? (
    <ChatWidgetErrorBoundary>
      <div className="elevenlabs-chat-wrapper">
        <elevenlabs-convai agent-id={ELEVENLABS_AGENT_ID}></elevenlabs-convai>
      </div>
    </ChatWidgetErrorBoundary>
  ) : null;
};

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
          
          {/* Widget component with navigation support */}
          <ElevenLabsWidget />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
