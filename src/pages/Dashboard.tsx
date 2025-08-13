import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, Users, Phone, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import CallHistory from "./CallHistory";
import DashboardHome from "@/components/DashboardHome";
import Settings from "./Settings";
import Employees from "./Employees";
import Billing from "./Billing";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  members_count: number;
  agent_id: string[] | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0); // Key to force component remount
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const getPageTitle = () => {
    return "Dashboard";
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrganizations();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        // If profile doesn't exist, sign out user
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log("Profile not found, signing out user");
          await supabase.auth.signOut();
          return;
        }
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil: " + error.message,
          variant: "destructive",
        });
        return;
      }

      // If no profile data found, sign out user
      if (!data) {
        console.log("No profile data found, signing out user");
        await supabase.auth.signOut();
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      // On any error, sign out to avoid getting stuck
      await supabase.auth.signOut();
    }
  };

  const fetchOrganizations = async () => {
    if (!user) return;

    try {
      // Fetch organizations where user is the owner
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from("organizations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownedError) {
        console.error("Error fetching owned organizations:", ownedError);
      }

      // Fetch organizations where user is a member
      console.log("Fetching organizations for user:", user.id);
      const { data: memberOrgs, error: memberError } = await supabase
        .from("organization_members")
        .select(`
          organizations (
            id,
            user_id,
            name,
            description,
            domain,
            members_count,
            agent_id,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");
      
      console.log("Member organizations result:", { memberOrgs, memberError });

      if (memberError) {
        console.error("Error fetching member organizations:", memberError);
      }

      // Combine both lists and remove duplicates
      const allOrgs: Organization[] = [];
      
      // Add owned organizations
      if (ownedOrgs) {
        allOrgs.push(...ownedOrgs);
      }

      // Add member organizations (avoid duplicates)
      if (memberOrgs) {
        memberOrgs.forEach(member => {
          if (member.organizations) {
            const org = member.organizations;
            const isDuplicate = allOrgs.some(existingOrg => existingOrg.id === org.id);
            if (!isDuplicate) {
              allOrgs.push(org as Organization);
            }
          }
        });
      }

      // Sort by creation date
      allOrgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (ownedError && memberError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar organizações",
          variant: "destructive",
        });
        return;
      }

      setOrganizations(allOrgs);
      
      // Check if user just accepted an invitation
      const justAcceptedInvitation = localStorage.getItem("justAcceptedInvitation");
      const savedOrgId = localStorage.getItem("selectedOrganizationId");
      
      if (justAcceptedInvitation === "true" && savedOrgId && allOrgs.length > 0) {
        // User just accepted an invitation, prioritize the accepted organization
        const acceptedOrg = allOrgs.find(org => org.id === savedOrgId);
        if (acceptedOrg) {
          setSelectedOrg(acceptedOrg);
          localStorage.setItem("selectedOrganizationId", acceptedOrg.id);
          // Clear the flag
          localStorage.removeItem("justAcceptedInvitation");
          toast({
            title: "Bem-vindo!",
            description: `Agora você está visualizando ${acceptedOrg.name}`,
          });
        } else {
          // Fallback to first organization if accepted org not found
          setSelectedOrg(allOrgs[0]);
          localStorage.setItem("selectedOrganizationId", allOrgs[0].id);
        }
      } else if (savedOrgId && allOrgs.length > 0) {
        // Try to restore selected organization from localStorage
        const savedOrg = allOrgs.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setSelectedOrg(savedOrg);
        } else if (allOrgs.length > 0) {
          // If saved org not found, select first one
          setSelectedOrg(allOrgs[0]);
          localStorage.setItem("selectedOrganizationId", allOrgs[0].id);
        }
      } else if (allOrgs.length > 0) {
        // If no saved org, select first one
        setSelectedOrg(allOrgs[0]);
        localStorage.setItem("selectedOrganizationId", allOrgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle organization change
  const handleOrganizationChange = (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setSelectedOrg(org);
      localStorage.setItem("selectedOrganizationId", org.id);
      // Force reload of all dashboard components
      setReloadKey(prev => prev + 1);
      
      toast({
        title: "Organização alterada",
        description: `Agora visualizando dados de: ${org.name}`,
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Redirecionando para login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar user={user} profile={profile} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {organizations.length > 0 ? (
                  <Select 
                    value={selectedOrg?.id || ""} 
                    onValueChange={handleOrganizationChange}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Selecionar organização" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-muted-foreground">
                    Nenhuma organização encontrada
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/create-organization")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Organização
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardHome key={`home-${reloadKey}`} selectedOrganization={selectedOrg} />} />
              <Route path="/call-history" element={<CallHistory key={`history-${reloadKey}`} selectedOrganization={selectedOrg} />} />
              <Route path="/settings" element={<Settings key={`settings-${reloadKey}`} selectedOrganization={selectedOrg} onOrganizationUpdate={setSelectedOrg} />} />
              <Route path="/employees" element={<Employees key={`employees-${reloadKey}`} selectedOrganization={selectedOrg} />} />
              <Route path="/billing" element={<Billing key={`billing-${reloadKey}`} />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;