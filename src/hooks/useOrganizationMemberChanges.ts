import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationMemberChange {
  user_id: string;
  organization_id: string;
  role: string;
  status: string;
}

export const useOrganizationMemberChanges = () => {
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isSubscribed) return;

        // Subscribe to changes in organization_members table
        const channel = supabase
          .channel('organization-member-changes')
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

              if (!affectsCurrentUser) return;

              if (payload.eventType === 'UPDATE') {
                const oldData = payload.old as OrganizationMemberChange;
                const newData = payload.new as OrganizationMemberChange;
                
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

                  // Refresh page after 2 seconds
                  setTimeout(() => {
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
                    window.location.reload();
                  }, 2000);
                }
              }

              if (payload.eventType === 'DELETE') {
                toast({
                  title: "Removido da organização",
                  description: "Você foi removido desta organização",
                  variant: "destructive",
                  duration: 5000,
                });

                // Refresh page after 2 seconds to redirect to available organizations
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up organization member changes subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      isSubscribed = false;
    };
  }, [toast]);
};