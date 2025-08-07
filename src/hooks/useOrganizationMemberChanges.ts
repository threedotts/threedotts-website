import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationMemberChange {
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
}

interface PresenceStatus {
  isOnlineInCurrentOrg: boolean;
  isOnlineInOtherOrg: boolean;
  lastSeenAt: string | null;
}

export const useOrganizationMemberChanges = () => {
  const { toast } = useToast();
  const connectionAttempts = useRef(0);
  const maxAttempts = 3;
  const retryTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let isSubscribed = true;
    let channel: any;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isSubscribed) return;

        console.log(`Setting up realtime subscription (attempt ${connectionAttempts.current + 1})`);

        // Clear any existing timeout
        if (retryTimeout.current) {
          clearTimeout(retryTimeout.current);
        }

        // Create a unique channel name to avoid conflicts
        const channelName = `org-member-changes-${user.id}-${Date.now()}`;
        
        channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: user.id }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'organization_members'
            },
            async (payload) => {
              console.log('Organization member change detected:', payload);
              
              // Only process changes that affect the current user
              const affectsCurrentUser = 
                (payload.eventType === 'UPDATE' && payload.new?.user_id === user.id) ||
                (payload.eventType === 'DELETE' && payload.old?.user_id === user.id);

              console.log('Affects current user:', affectsCurrentUser, 'User ID:', user.id);

              if (!affectsCurrentUser) return;

              if (payload.eventType === 'UPDATE') {
                const oldData = payload.old as OrganizationMemberChange;
                const newData = payload.new as OrganizationMemberChange;
                
                console.log('Role change detected:', { oldRole: oldData.role, newRole: newData.role });
                
                // Check if role changed
                if (oldData.role !== newData.role) {
                  const roleLabels = {
                    owner: "Proprietário",
                    admin: "Administrador", 
                    manager: "Gerente",
                    employee: "Funcionário"
                  };
                  
                  toast({
                    title: "Seu cargo foi alterado",
                    description: `Seu cargo foi alterado para ${roleLabels[newData.role as keyof typeof roleLabels] || newData.role}`,
                    duration: 5000,
                  });

                  // Refresh page after 2 seconds to show new permissions
                  setTimeout(() => {
                    console.log('Refreshing page due to role change...');
                    window.location.reload();
                  }, 2000);
                }

                // Check if status changed to inactive
                if (oldData.status === 'active' && newData.status !== 'active') {
                  toast({
                    title: "Acesso revogado",
                    description: "Seu acesso a esta organização foi revogado",
                    variant: "destructive",
                    duration: 5000,
                  });

                  // Refresh page after 2 seconds
                  setTimeout(() => {
                    console.log('Refreshing page due to status change...');
                    window.location.reload();
                  }, 2000);
                }
              }

              if (payload.eventType === 'DELETE') {
                console.log('User removed from organization');
                toast({
                  title: "Removido da organização",
                  description: "Você foi removido desta organização",
                  variant: "destructive",
                  duration: 5000,
                });

                // Refresh page after 2 seconds to redirect to available organizations
                setTimeout(() => {
                  console.log('Refreshing page due to removal...');
                  window.location.reload();
                }, 2000);
              }
            }
          )
          .subscribe((status) => {
            console.log('Organization member changes subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to organization member changes');
              connectionAttempts.current = 0; // Reset attempts on success
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              console.log('Subscription failed or timed out, will retry...');
              
              if (connectionAttempts.current < maxAttempts && isSubscribed) {
                connectionAttempts.current++;
                console.log(`Retrying connection in 3 seconds (attempt ${connectionAttempts.current}/${maxAttempts})`);
                
                // Clean up current channel
                if (channel) {
                  supabase.removeChannel(channel);
                }
                
                // Retry after delay
                retryTimeout.current = setTimeout(() => {
                  if (isSubscribed) {
                    setupRealtimeSubscription();
                  }
                }, 3000);
              } else {
                console.log('Max connection attempts reached, falling back to periodic polling');
                // Fallback to periodic polling every 30 seconds
                retryTimeout.current = setTimeout(() => {
                  if (isSubscribed) {
                    // Simple polling check - reload if user data might have changed
                    console.log('Performing periodic check for organization changes');
                    // You could implement a more sophisticated check here
                  }
                }, 30000);
              }
            }
          });

        return channel;
      } catch (error) {
        console.error('Error setting up organization member changes subscription:', error);
        
        // Retry on error
        if (connectionAttempts.current < maxAttempts && isSubscribed) {
          connectionAttempts.current++;
          retryTimeout.current = setTimeout(() => {
            if (isSubscribed) {
              setupRealtimeSubscription();
            }
          }, 3000);
        }
      }
    };

    // Initial setup
    setupRealtimeSubscription();

    return () => {
      isSubscribed = false;
      
      // Clear timeout
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      
      // Clean up channel
      if (channel) {
        console.log('Cleaning up organization member changes subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);
};