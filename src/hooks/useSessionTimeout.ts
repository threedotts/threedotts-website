import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export const useSessionTimeout = (isAuthenticated: boolean = false) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    // Only start timeout for authenticated users
    if (!isAuthenticated) return;
    
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      toast({
        title: "Sessão expirando",
        description: "Sua sessão expirará em 5 minutos por inatividade. Clique em qualquer lugar para continuar.",
        variant: "destructive",
      });
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      console.log('[SECURITY] Session timeout - logging out user at:', new Date().toISOString());
      await supabase.auth.signOut();
      toast({
        title: "Sessão expirada",
        description: "Você foi desconectado por inatividade.",
        variant: "destructive",
      });
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    // Only set up activity tracking for authenticated users
    if (!isAuthenticated) {
      // Clear any existing timers if user becomes unauthenticated
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Track user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
    };
  }, [toast, isAuthenticated]);

  return { resetTimeout };
};