import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
}

export const useUserPresence = () => {
  const [presenceData, setPresenceData] = useState<Record<string, UserPresence>>({});
  const { toast } = useToast();

  // Update user's own presence status
  const updatePresence = async (isOnline: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
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
    if (userIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      const presenceMap: Record<string, UserPresence> = {};
      data?.forEach((presence) => {
        presenceMap[presence.user_id] = presence;
      });

      setPresenceData(presenceMap);
    } catch (error) {
      console.error('Error fetching presence data:', error);
    }
  };

  // Set up realtime subscription for presence updates
  useEffect(() => {
    const channel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const presence = payload.new as UserPresence;
            setPresenceData(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Set user as online when hook initializes
  useEffect(() => {
    updatePresence(true);

    // Set up periodic heartbeat to maintain online status
    const heartbeat = setInterval(() => {
      updatePresence(true);
    }, 30000); // Update every 30 seconds

    // Set user as offline when page unloads
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    // Set user as offline when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false);
      } else {
        updatePresence(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
    };
  }, []);

  return {
    presenceData,
    fetchPresenceData,
    updatePresence,
  };
};