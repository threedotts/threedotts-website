import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, Users, Phone, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  organization_name: string;
  organization_members_count: number;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil: " + error.message,
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
      setSelectedOrg(data.organization_name);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
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

  // Mock data for statistics
  const stats = [
    {
      title: "Total de Chamadas",
      value: "1,234",
      change: "+12%",
      icon: Phone,
      color: "text-primary"
    },
    {
      title: "Agentes Ativos",
      value: profile.organization_members_count.toString(),
      change: "+2",
      icon: Users,
      color: "text-accent"
    },
    {
      title: "Taxa de Conversão",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-primary-glow"
    },
    {
      title: "Tempo Médio",
      value: "2:34",
      change: "-15s",
      icon: Clock,
      color: "text-muted-foreground"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar user={user} profile={profile} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecionar organização" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value={profile.organization_name}>
                      {profile.organization_name}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Organização
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Overview
              </h2>
              <p className="text-muted-foreground">
                Visão geral das operações de call center e automação
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="bg-gradient-card border-border shadow-elegant">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {stat.value}
                          </p>
                          <p className={`text-sm ${stat.color}`}>
                            {stat.change} desde o último mês
                          </p>
                        </div>
                        <IconComponent className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Center Activity */}
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-foreground">Atividade do Call Center</CardTitle>
                  <CardDescription>
                    Visão geral das chamadas em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-foreground font-medium">Chamadas Ativas</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">8</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-accent rounded-full"></div>
                        <span className="text-foreground font-medium">Fila de Espera</span>
                      </div>
                      <span className="text-2xl font-bold text-accent">12</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary-glow rounded-full"></div>
                        <span className="text-foreground font-medium">Chamadas Hoje</span>
                      </div>
                      <span className="text-2xl font-bold text-primary-glow">247</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Status */}
              <Card className="bg-gradient-card border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-foreground">Status da Automação</CardTitle>
                  <CardDescription>
                    Sistemas de automação em funcionamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-foreground font-medium">Chatbot AI</span>
                      </div>
                      <span className="text-sm text-primary font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-foreground font-medium">Auto-Resposta</span>
                      </div>
                      <span className="text-sm text-primary font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-foreground font-medium">Roteamento</span>
                      </div>
                      <span className="text-sm text-primary font-medium">Online</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;