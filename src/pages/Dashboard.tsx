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

  // Mock data for statistics similar to reference
  const stats = [
    {
      title: "Active Calls",
      value: "12",
      change: "7.4%",
      changeType: "positive",
      color: "bg-green-100 text-green-800 border-green-200"
    },
    {
      title: "Resolved Calls", 
      value: "42",
      change: "7.4%",
      changeType: "positive",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      title: "Escalated Calls",
      value: "18", 
      change: "7.4%",
      changeType: "positive",
      color: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
      title: "Missed Calls",
      value: "08",
      change: "7.4%",
      changeType: "negative",
      color: "bg-orange-100 text-orange-800 border-orange-200"
    },
    {
      title: "Dropped Calls",
      value: "14",
      change: "7.4%",
      changeType: "positive", 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar user={user} profile={profile} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Welcome {user.email?.split('@')[0]}</h1>
                  <p className="text-sm text-gray-500">Department of {profile.organization_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white rounded-md shadow-sm">
                    Calls
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-500">
                    Chats
                  </button>
                </div>
                <div className="flex space-x-1 ml-4">
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">12 months</button>
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-500">30 days</button>
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-500">7 days</button>
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-500">24 hours</button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        stat.title === 'Active Calls' ? 'bg-green-500' :
                        stat.title === 'Resolved Calls' ? 'bg-blue-500' :
                        stat.title === 'Escalated Calls' ? 'bg-purple-500' :
                        stat.title === 'Missed Calls' ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">{stat.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                      <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Occupancy Chart */}
              <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg font-semibold flex items-center">
                    Occupancy of AI Voice Agents
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2 pb-4">
                    {/* Mock bar chart */}
                    {[4, 6, 8, 5, 9, 7, 6, 3, 7, 6, 4, 2].map((height, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className={`w-8 ${index === 4 ? 'bg-blue-600' : 'bg-gray-300'} rounded-t`}
                          style={{height: `${height * 20}px`}}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">From Jan 2023 till Jan 2024</p>
                </CardContent>
              </Card>

              {/* Top Trending Call Enquiries */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg font-semibold flex items-center">
                    Top Trending Call Enquiries
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </CardTitle>
                  <div className="flex space-x-4 text-sm">
                    <button className="text-blue-600 border-b-2 border-blue-600 pb-1">Received</button>
                    <button className="text-gray-500">Resolved</button>
                    <button className="text-gray-500">Escalated</button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {name: 'Opening hours', percentage: 91, calls: 112, color: 'bg-purple-500'},
                      {name: 'Museum fees', percentage: 89, calls: 90, color: 'bg-pink-500'},
                      {name: 'Creative visa', percentage: 88, calls: 87, color: 'bg-pink-500'},
                      {name: 'Tourist attractions', percentage: 76, calls: 79, color: 'bg-pink-500'},
                      {name: 'Events schedule', percentage: 69, calls: 77, color: 'bg-pink-500'},
                      {name: 'Cultural festivals', percentage: 65, calls: 71, color: 'bg-pink-500'},
                      {name: 'Travel advice', percentage: 54, calls: 67, color: 'bg-pink-500'},
                      {name: 'Transportation options', percentage: 40, calls: 66, color: 'bg-pink-500'},
                      {name: 'Sightseeing tours', percentage: 21, calls: 62, color: 'bg-pink-500'}
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="text-gray-900 font-medium">{item.calls}</span>
                          </div>
                          <div className="mt-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full`}
                              style={{width: `${item.percentage}%`}}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Tags</span>
                            <span>{item.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Received Calls Timeline */}
              <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg font-semibold flex items-center">
                    Received Calls Timeline Analysis
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 relative">
                    <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm">
                      <div>Received 16k</div>
                      <div className="text-xs text-gray-300">Since last month +2.9%</div>
                      <div className="text-xs">
                        <span className="text-green-400">Resolved 4.8k</span> | 
                        <span className="text-red-400"> Escalated 4.8k</span> | 
                        <span className="text-yellow-400"> Dropped 2.5k</span>
                      </div>
                    </div>
                    
                    {/* Mock chart area */}
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-full h-full" viewBox="0 0 800 200">
                        <path d="M50 150 Q200 120 300 140 T500 130 T750 110" stroke="#10b981" strokeWidth="3" fill="none"/>
                        <path d="M50 160 Q200 140 300 150 T500 140 T750 130" stroke="#3b82f6" strokeWidth="3" fill="none"/>
                        <path d="M50 170 Q200 160 300 160 T500 150 T750 140" stroke="#f59e0b" strokeWidth="3" fill="none"/>
                        <path d="M50 180 Q200 170 300 170 T500 160 T750 150" stroke="#ef4444" strokeWidth="3" fill="none"/>
                      </svg>
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