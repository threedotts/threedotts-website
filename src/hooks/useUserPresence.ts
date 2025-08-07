import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserPresence {
  user_id: string;
  organization_id: string;
  is_online: boolean;
  last_seen_at: string;
}

interface PresenceStatus {
  isOnlineInCurrentOrg: boolean;
  isOnlineInOtherOrg: boolean;
  lastSeenAt: string | null;
}

export const useUserPresence = (currentOrganizationId?: string) => {
  const [presenceData, setPresenceData] = useState<Record<string, PresenceStatus>>({});
  const { toast } = useToast();

  // Update user's own presence status for a specific organization
  const updatePresence = async (isOnline: boolean, organizationId?: string) => {
    if (!organizationId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          organization_id: organizationId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,organization_id'
        });

      if (error) {
        console.error('Error updating presence:', error);
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Fetch presence data for organization members
  const fetchPresenceData = async (userIds: string[]) => {
    if (userIds.length === 0 || !currentOrganizationId) return;

    try {
      // Get presence data for current organization
      const { data: currentOrgPresence, error: currentError } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)
        .eq('organization_id', currentOrganizationId);

      if (currentError) throw currentError;

      // Get presence data for other organizations to detect "away" status
      const { data: allPresence, error: allError } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)
        .neq('organization_id', currentOrganizationId)
        .eq('is_online', true);

      if (allError) throw allError;

      const presenceMap: Record<string, PresenceStatus> = {};
      
      // Initialize all users with offline status
      userIds.forEach(userId => {
        presenceMap[userId] = {
          isOnlineInCurrentOrg: false,
          isOnlineInOtherOrg: false,
          lastSeenAt: null,
        };
      });

      // Set current org presence
      currentOrgPresence?.forEach((presence) => {
        presenceMap[presence.user_id] = {
          ...presenceMap[presence.user_id],
          isOnlineInCurrentOrg: presence.is_online,
          lastSeenAt: presence.last_seen_at,
        };
      });

      // Set other org presence (away status)
      allPresence?.forEach((presence) => {
        if (presenceMap[presence.user_id]) {
          presenceMap[presence.user_id].isOnlineInOtherOrg = true;
        }
      });

      setPresenceData(presenceMap);
    } catch (error) {
      console.error('Error fetching presence data:', error);
    }
  };

  // Set up realtime subscription for presence updates
  useEffect(() => {
    if (!currentOrganizationId) return;

    // Set up realtime subscription for all presence changes
    const channel = supabase
      .channel(`user-presence-global`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        async (payload) => {
          console.log('Presence change detected:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const presence = payload.new as UserPresence;
            
            // Only update if this user is in our current presence data
            setPresenceData(prev => {
              if (!prev[presence.user_id]) {
                return prev; // Don't add new users automatically
              }
              
              const updated = { ...prev };
              
              if (presence.organization_id === currentOrganizationId) {
                // Update current org status
                updated[presence.user_id] = {
                  ...updated[presence.user_id],
                  isOnlineInCurrentOrg: presence.is_online,
                  lastSeenAt: presence.last_seen_at,
                };
              } else {
                // Update other org status (away)
                updated[presence.user_id] = {
                  ...updated[presence.user_id],
                  isOnlineInOtherOrg: presence.is_online,
                };
              }
              
              return updated;
            });
          }

          if (payload.eventType === 'DELETE') {
            const presence = payload.old as UserPresence;
            
            setPresenceData(prev => {
              if (!prev[presence.user_id]) {
                return prev;
              }
              
              const updated = { ...prev };
              
              if (presence.organization_id === currentOrganizationId) {
                // User went offline in current org
                updated[presence.user_id] = {
                  ...updated[presence.user_id],
                  isOnlineInCurrentOrg: false,
                  lastSeenAt: presence.last_seen_at,
                };
              } else {
                // User went offline in other org
                updated[presence.user_id] = {
                  ...updated[presence.user_id],
                  isOnlineInOtherOrg: false,
                };
              }
              
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganizationId]);

  // Periodic refresh of presence data
  useEffect(() => {
    if (!currentOrganizationId) return;

    const refreshPresence = setInterval(() => {
      // Re-fetch presence data for all current users
      const currentUserIds = Object.keys(presenceData);
      if (currentUserIds.length > 0) {
        fetchPresenceData(currentUserIds);
      }
    }, 20000); // Refresh every 20 seconds

    return () => {
      clearInterval(refreshPresence);
    };
  }, [currentOrganizationId, presenceData]);

  // Set user as online when hook initializes and manage cleanup
  useEffect(() => {
    if (!currentOrganizationId) return;

    updatePresence(true, currentOrganizationId);

    // Set up more frequent heartbeat (every 15 seconds)
    const heartbeat = setInterval(() => {
      updatePresence(true, currentOrganizationId);
    }, 15000);

    // Set up cleanup of inactive users (every 30 seconds)
    const cleanup = setInterval(async () => {
      try {
        await supabase.functions.invoke('cleanup-inactive-users');
      } catch (error) {
        console.error('Error cleaning up inactive users:', error);
      }
    }, 30000);

    // Set user as offline when page unloads
    const handleBeforeUnload = () => {
      updatePresence(false, currentOrganizationId);
    };

    // Set user as offline when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false, currentOrganizationId);
      } else {
        updatePresence(true, currentOrganizationId);
      }
    };

    // Set user as offline when window loses focus
    const handleBlur = () => {
      updatePresence(false, currentOrganizationId);
    };

    // Set user as online when window gains focus
    const handleFocus = () => {
      updatePresence(true, currentOrganizationId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(heartbeat);
      clearInterval(cleanup);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      updatePresence(false, currentOrganizationId);
    };
  }, [currentOrganizationId]);

  return {
    presenceData,
    fetchPresenceData,
    updatePresence,
  };
};