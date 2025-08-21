import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  agent_id?: string[];
}

interface UseConversationPollingProps {
  selectedOrganization?: Organization;
  enabled?: boolean;
}

export const useConversationPolling = ({ 
  selectedOrganization, 
  enabled = true 
}: UseConversationPollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = async () => {
    if (!selectedOrganization?.agent_id || selectedOrganization.agent_id.length === 0) {
      console.log('No agent IDs found for organization:', selectedOrganization?.id);
      return;
    }

    try {
      console.log('Fetching conversations for agents:', selectedOrganization.agent_id);
      
      const { data, error } = await supabase.functions.invoke('fetch-conversations', {
        body: { agentIds: selectedOrganization.agent_id }
      });

      if (error) {
        console.error('Error calling fetch-conversations function:', error);
        return;
      }

      console.log('Conversation polling results:', data);
      
      // Log each agent's conversations separately for better visibility
      data.results?.forEach((result: any) => {
        if (result.error) {
          console.error(`Error for agent ${result.agentId}:`, result.error);
        } else {
          console.log(`Conversations for agent ${result.agentId}:`, result.data);
        }
      });

    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (!enabled || !selectedOrganization?.agent_id?.length) {
      // Clear existing interval if conditions not met
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchConversations();

    // Set up polling every 15 seconds
    intervalRef.current = setInterval(fetchConversations, 15000);

    console.log('Started conversation polling every 15 seconds for organization:', selectedOrganization.id);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Stopped conversation polling for organization:', selectedOrganization.id);
      }
    };
  }, [selectedOrganization?.id, selectedOrganization?.agent_id, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
};