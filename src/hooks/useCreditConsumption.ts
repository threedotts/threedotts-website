import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsumeCreditsParams {
  organizationId: string;
  creditsToConsume: number;
  callId?: string;
  durationMinutes?: number;
}

export const useCreditConsumption = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const consumeCredits = async ({
    organizationId,
    creditsToConsume,
    callId,
    durationMinutes
  }: ConsumeCreditsParams): Promise<boolean> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('consume_credits', {
        org_id: organizationId,
        credits_to_consume: creditsToConsume,
        call_id: callId,
        duration_minutes: durationMinutes
      });

      if (error) {
        console.error('Error consuming credits:', error);
        toast({
          title: "Erro",
          description: "Falha ao consumir créditos",
          variant: "destructive"
        });
        return false;
      }

      if (!data) {
        toast({
          title: "Créditos Insuficientes",
          description: "Não há créditos suficientes para esta operação. Faça uma recarga.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error consuming credits:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao consumir créditos",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkCreditBalance = async (organizationId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('current_credits')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error checking credit balance:', error);
        return null;
      }

      return data?.current_credits || 0;
    } catch (error) {
      console.error('Error checking credit balance:', error);
      return null;
    }
  };

  return {
    consumeCredits,
    checkCreditBalance,
    loading
  };
};