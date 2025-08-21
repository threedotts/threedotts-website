import { useEffect, useRef, useMemo } from 'react';
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

  // Create stable reference for agent IDs to avoid unnecessary re-renders
  const sortedAgentIds = useMemo(() => {
    if (!selectedOrganization?.agent_id?.length) return [];
    return [...selectedOrganization.agent_id].sort();
  }, [selectedOrganization?.agent_id]);

  const fetchConversations = async () => {
    if (!sortedAgentIds.length) {
      console.log('No agent IDs found for organization:', selectedOrganization?.id);
      return;
    }

    try {
      console.log('Fetching conversations for agents:', sortedAgentIds);
      
      const { data, error } = await supabase.functions.invoke('fetch-conversations', {
        body: { agentIds: sortedAgentIds }
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
          
          // Count done conversations by agent name for browser console
          const doneByAgent: { [agentName: string]: number } = {};
          
          if (result.data && Array.isArray(result.data)) {
            result.data.forEach((conversation: any) => {
              if (conversation.status === 'done') {
                const agentName = conversation.agent_name || 'Unknown Agent';
                doneByAgent[agentName] = (doneByAgent[agentName] || 0) + 1;
              }
            });
          }
          
          // Log the done counts in browser console
          const agentNames = new Set(result.data?.map((conv: any) => conv.agent_name || 'Unknown Agent') || []);
          agentNames.forEach((agentName: string) => {
            const count = doneByAgent[agentName] || 0;
            console.log(`${agentName}: ${count}`);
          });
          
          // If no conversations at all, show 0
          if (!result.data || result.data.length === 0) {
            console.log(`Agent ${result.agentId}: 0`);
          }
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

    if (!enabled || !sortedAgentIds.length) {
      return;
    }

    const orgId = selectedOrganization?.id;
    console.log(`Setting up conversation polling for org ${orgId} with agents:`, sortedAgentIds);

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
  }, [enabled, selectedOrganization?.id, sortedAgentIds]);

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