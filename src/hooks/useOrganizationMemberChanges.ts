import { useEffect, useRef, useState } from 'react';
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

export const useOrganizationMemberChanges = (
  onShowRefreshDialog: (message: string) => void
) => {
  const { toast } = useToast();
  const connectionAttempts = useRef(0);
  const maxAttempts = 2; // Reduzir tentativas
  const retryTimeout = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
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
                  
                  onShowRefreshDialog(`Seu cargo foi alterado para ${roleLabels[newData.role as keyof typeof roleLabels] || newData.role}. Deseja atualizar a página para ver as novas permissões?`);
                }

                // Check if status changed to inactive
                if (oldData.status === 'active' && newData.status !== 'active') {
                  onShowRefreshDialog("Seu acesso a esta organização foi revogado. A página será atualizada.");
                }
              }

              if (payload.eventType === 'DELETE') {
                console.log('User removed from organization');
                onShowRefreshDialog("Você foi removido desta organização. A página será atualizada.");
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
                console.log('Max connection attempts reached, realtime disabled for this session');
                toast({
                  title: "Conexão em tempo real indisponível",
                  description: "As atualizações automáticas estão temporariamente indisponíveis. Por favor, recarregue a página ocasionalmente para ver mudanças.",
                  duration: 8000,
                });
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
      isInitializedRef.current = false;
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
  }, [toast, onShowRefreshDialog]);
};