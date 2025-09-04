import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleAuthCallback = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleGoogleAuthCallback = async () => {
      const pendingOrgName = localStorage.getItem('pending_organization_name');
      
      if (pendingOrgName) {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Check if this is a new user (user was just created)
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            // If user exists but doesn't have an organization yet
            const { data: organizations } = await supabase
              .from('organizations')
              .select('*')
              .eq('user_id', session.user.id);

            if (profile && (!organizations || organizations.length === 0)) {
              // Create organization for Google OAuth user
              const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({
                  user_id: session.user.id,
                  name: pendingOrgName,
                  members_count: 1
                })
                .select()
                .single();

              if (orgError) {
                console.error('Error creating organization:', orgError);
                toast({
                  title: "Erro ao criar organização",
                  description: "Falha ao criar a organização. Tente novamente.",
                  variant: "destructive",
                });
                return;
              }

              // Add user as organization member
              const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: newOrg.id,
                  user_id: session.user.id,
                  role: 'owner',
                  status: 'active',
                  joined_at: new Date().toISOString(),
                  email: session.user.email
                });

              if (memberError) {
                console.error('Error adding organization member:', memberError);
              }

              toast({
                title: "Conta criada com sucesso!",
                description: `Bem-vindo à ${pendingOrgName}`,
                variant: "default",
              });
            }

            // Clean up localStorage
            localStorage.removeItem('pending_organization_name');
          }
        } catch (error) {
          console.error('Error in Google auth callback:', error);
          localStorage.removeItem('pending_organization_name');
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Small delay to ensure profile is created by trigger
          setTimeout(handleGoogleAuthCallback, 1000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);
};