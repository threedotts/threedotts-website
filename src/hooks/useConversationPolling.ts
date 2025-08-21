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
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !selectedOrganization?.agent_id?.length) {
      return;
    }

    // Convert agent_id array to string for stable comparison
    const agentIdString = JSON.stringify(selectedOrganization.agent_id.sort());
    const orgId = selectedOrganization.id;

    console.log(`Setting up conversation polling for org ${orgId} with agents:`, selectedOrganization.agent_id);

    // Initial fetch
    fetchConversations();

    // Set up polling every 15 seconds
    intervalRef.current = setInterval(() => {
      console.log(`Polling conversations for org ${orgId}`);
      fetchConversations();
    }, 15000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Stopped conversation polling for organization:', orgId);
      }
    };
  }, [enabled, selectedOrganization?.id, JSON.stringify(selectedOrganization?.agent_id?.sort())]);

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