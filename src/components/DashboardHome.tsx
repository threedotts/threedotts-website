import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserPresence } from '@/hooks/useUserPresence';

interface Organization {
  id: string;
  user_id: string;
  name: string;
  description: string;
  domain: string;
  members_count: number;
  created_at: string;
  updated_at: string;
}

interface DashboardHomeProps {
  selectedOrganization: Organization | null;
}

export default function DashboardHome({ selectedOrganization }: DashboardHomeProps) {
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 0,
    averageDuration: "0:00",
    successRate: "0%",
    callsToday: 0,
    previousMonthCalls: 0,
    previousMonthDuration: 0,
    previousMonthSuccessRate: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  const { presenceData, fetchPresenceData } = useUserPresence(selectedOrganization?.id);

  // Fetch organization members
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('user_id, email')
        .eq('organization_id', selectedOrganization.id)
        .eq('status', 'active');

      if (data) {
        setMembers(data);
        fetchPresenceData(data.map(m => m.user_id));
      }
    };

    fetchMembers();
  }, [selectedOrganization?.id, fetchPresenceData]);

  // Fetch dashboard statistics
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchDashboardData = async () => {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get current month calls
      const { data: currentCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result, date')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', currentMonth.toISOString());

      // Get previous month calls for comparison
      const { data: previousCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', previousMonth.toISOString())
        .lt('created_at', currentMonth.toISOString());

      // Get today's calls
      const todayCalls = currentCalls?.filter(call => 
        new Date(call.date).toDateString() === today.toDateString()
      ) || [];

      // Calculate metrics
      const totalCalls = currentCalls?.length || 0;
      const totalDuration = currentCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const averageDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const averageDuration = `${Math.floor(averageDurationSeconds / 60)}:${(averageDurationSeconds % 60).toString().padStart(2, '0')}`;
      
      const successfulCalls = currentCalls?.filter(call => 
        call.evaluation_result?.toLowerCase().includes('positiv') || 
        call.evaluation_result?.toLowerCase().includes('sucesso') ||
        call.evaluation_result?.toLowerCase().includes('bom')
      ).length || 0;
      const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

      // Previous month comparison
      const previousMonthCalls = previousCalls?.length || 0;
      const previousMonthDuration = previousCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const previousMonthAvgDuration = previousMonthCalls > 0 ? Math.round(previousMonthDuration / previousMonthCalls) : 0;
      const previousSuccessfulCalls = previousCalls?.filter(call => 
        call.evaluation_result?.toLowerCase().includes('positiv') || 
        call.evaluation_result?.toLowerCase().includes('sucesso') ||
        call.evaluation_result?.toLowerCase().includes('bom')
      ).length || 0;
      const previousMonthSuccessRate = previousMonthCalls > 0 ? Math.round((previousSuccessfulCalls / previousMonthCalls) * 100) : 0;

      setDashboardData({
        totalCalls,
        averageDuration,
        successRate: `${successRate}%`,
        callsToday: todayCalls.length,
        previousMonthCalls,
        previousMonthDuration: previousMonthAvgDuration,
        previousMonthSuccessRate
      });
    };

    fetchDashboardData();
  }, [selectedOrganization?.id]);

  // Fetch chart data for last 7 months
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchChartData = async () => {
      const chartDataArray = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const { data: monthCalls } = await supabase
          .from('call_transcriptions')
          .select('evaluation_result')
          .eq('organization_id', selectedOrganization.id)
          .gte('created_at', monthDate.toISOString())
          .lt('created_at', nextMonth.toISOString());

        const totalCalls = monthCalls?.length || 0;
        const successfulCalls = monthCalls?.filter(call => 
          call.evaluation_result?.toLowerCase().includes('positiv') || 
          call.evaluation_result?.toLowerCase().includes('sucesso') ||
          call.evaluation_result?.toLowerCase().includes('bom')
        ).length || 0;

        chartDataArray.push({
          name: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
          chamadas: totalCalls,
          sucessos: successfulCalls
        });
      }
      
      setChartData(chartDataArray);
    };

    fetchChartData();
  }, [selectedOrganization?.id]);

  // Count online agents
  const onlineAgents = Object.values(presenceData).filter(p => p.isOnlineInCurrentOrg).length;

  // Calculate changes from previous month
  const callsChange = dashboardData.previousMonthCalls > 0 
    ? `${dashboardData.totalCalls > dashboardData.previousMonthCalls ? '+' : ''}${Math.round(((dashboardData.totalCalls - dashboardData.previousMonthCalls) / dashboardData.previousMonthCalls) * 100)}%`
    : '+0%';

  const durationChange = dashboardData.previousMonthDuration > 0
    ? `${Math.round((dashboardData.averageDuration.split(':').reduce((acc, val, i) => acc + parseInt(val) * (i === 0 ? 60 : 1), 0) - dashboardData.previousMonthDuration) / 60)}min`
    : '0min';

  const successRateChange = dashboardData.previousMonthSuccessRate > 0
    ? `${parseInt(dashboardData.successRate) > dashboardData.previousMonthSuccessRate ? '+' : ''}${parseInt(dashboardData.successRate) - dashboardData.previousMonthSuccessRate}%`
    : '+0%';

  const stats = [
    {
      title: "Total de Chamadas",
      value: dashboardData.totalCalls.toString(),
      change: callsChange,
      icon: Phone,
      color: "text-primary"
    },
    {
      title: "Agentes Online",
      value: onlineAgents.toString(),
      change: `de ${members.length} total`,
      icon: Users,
      color: "text-accent"
    },
    {
      title: "Taxa de Sucesso",
      value: dashboardData.successRate,
      change: successRateChange,
      icon: TrendingUp,
      color: "text-primary-glow"
    },
    {
      title: "Tempo Médio",
      value: dashboardData.averageDuration,
      change: durationChange,
      icon: Clock,
      color: "text-muted-foreground"
    }
  ];

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Overview
        </h2>
        <p className="text-muted-foreground">
          Visão geral das operações de call center
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
      <Card className="bg-gradient-card border-border shadow-elegant">
        <CardHeader>
          <CardTitle className="text-foreground">Atividade do Call Center</CardTitle>
          <CardDescription>
            Visão geral das chamadas em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <span className="text-2xl font-bold text-primary-glow">{dashboardData.callsToday}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <div className="mt-8">
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Mensal</CardTitle>
            <CardDescription>
              Evolução de chamadas e conversões ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="chamadas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    name="Chamadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sucessos" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 5 }}
                    name="Sucessos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}