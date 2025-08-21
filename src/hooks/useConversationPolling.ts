import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  agent_id?: string[];
}

interface UseConversationPollingProps {
  selectedOrganization?: Organization;
  enabled?: boolean;
}

interface ActiveCallsByAgent {
  [agentName: string]: number;
}

export const useConversationPolling = ({ 
  selectedOrganization, 
  enabled = true 
}: UseConversationPollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeCallsByAgent, setActiveCallsByAgent] = useState<ActiveCallsByAgent>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Create stable reference for agent IDs to avoid unnecessary re-renders
  const sortedAgentIds = useMemo(() => {
    if (!selectedOrganization?.agent_id?.length) return [];
    return [...selectedOrganization.agent_id].sort();
  }, [selectedOrganization?.agent_id]);

  const fetchConversations = useCallback(async () => {
    if (!sortedAgentIds.length) {
      console.log('No agent IDs found for organization:', selectedOrganization?.id);
      setActiveCallsByAgent({});
      return;
    }

    setIsLoading(true);

    try {
      console.log('Fetching conversations for agents:', sortedAgentIds);
      
      // Calculate timestamp for 12 hours ago in seconds
      const twelveHoursAgo = Math.floor((Date.now() - (12 * 60 * 60 * 1000)) / 1000);
      
      const { data, error } = await supabase.functions.invoke('fetch-conversations', {
        body: { 
          agentIds: sortedAgentIds,
          callStartAfterUnix: twelveHoursAgo
        }
      });

      if (error) {
        console.error('Error calling fetch-conversations function:', error);
        setIsLoading(false);
        return;
      }

      console.log('Conversation polling results:', data);
      
      // Aggregate active calls by agent
      const activeCalls: ActiveCallsByAgent = {};

      // Log each agent's conversations separately for better visibility
      data.results?.forEach((result: any) => {
        if (result.error) {
          console.error(`Error for agent ${result.agentId}:`, result.error);
        } else {
          console.log(`Conversations for agent ${result.agentId}:`, result.data);
          
          const conversations = result.data?.conversations;
          
          if (conversations && Array.isArray(conversations) && conversations.length > 0) {
            // Get all unique agent names from conversations
            const allAgentNames = new Set(conversations.map((conv: any) => conv.agent_name || 'Unknown Agent'));
            
            // Count in-progress conversations for each agent
            const inProgressByAgent: { [agentName: string]: number } = {};
            conversations.forEach((conversation: any) => {
              if (conversation.status === 'in-progress') {
                const agentName = conversation.agent_name || 'Unknown Agent';
                inProgressByAgent[agentName] = (inProgressByAgent[agentName] || 0) + 1;
              }
            });
            
            // Update active calls state and log
            allAgentNames.forEach((agentName: string) => {
              const count = inProgressByAgent[agentName] || 0;
              activeCalls[agentName] = count;
              console.log(`${agentName}: ${count}`);
            });
          } else {
            // If no conversations or invalid data, we can't determine agent name
            console.log(`No conversation data for agent ${result.agentId}`);
          }
        }
      });

      setActiveCallsByAgent(activeCalls);

    } catch (error) {
      console.error('Error fetching conversations:', error);
    }

    setIsLoading(false);
  }, [sortedAgentIds, selectedOrganization?.id]);

  // Page Visibility API - pause polling when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      if (isVisible) {
        console.log('Page became visible - resuming polling');
      } else {
        console.log('Page became hidden - pausing polling');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set initial state
    setIsPageVisible(!document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !sortedAgentIds.length) {
      console.log('Conversation polling disabled:', { enabled, agentCount: sortedAgentIds.length });
      // Clear active calls when disabled
      setActiveCallsByAgent({});
      return;
    }

    const orgId = selectedOrganization?.id;
    console.log(`Setting up conversation polling for org ${orgId} with agents:`, sortedAgentIds);

    // Initial fetch
    fetchConversations();

    // Set up polling every 45 seconds (only when page is visible)
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        console.log(`Polling conversations for org ${orgId}`);
        fetchConversations();
      } else {
        console.log(`Skipping poll - page not visible for org ${orgId}`);
      }
    }, 45000);

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

  return {
    activeCallsByAgent,
    isLoading
  };
};