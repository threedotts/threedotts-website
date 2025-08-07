import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [evaluationData, setEvaluationData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('mensal');
  
  const { presenceData, fetchPresenceData } = useUserPresence(selectedOrganization?.id);

  // Time filter options
  const timeFilters = [
    { value: 'diario', label: 'Diário' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' }
  ];

  // Get date range based on selected filter
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (selectedTimeFilter) {
      case 'diario':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semanal':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'mensal':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'anual':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

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
      const { startDate, endDate } = getDateRange();
      
      // Get current period calls
      const { data: currentCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result, date, created_at')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get previous period for comparison (same duration, shifted back)
      const periodDuration = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodDuration);
      const prevEndDate = new Date(startDate.getTime());

      const { data: previousCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', prevEndDate.toISOString());

      // Get today's calls for the specific metric
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayCalls = currentCalls?.filter(call => 
        new Date(call.created_at) >= todayStart
      ) || [];

      // Calculate metrics
      const totalCalls = currentCalls?.length || 0;
      const totalDuration = currentCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const averageDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const averageDuration = `${Math.floor(averageDurationSeconds / 60)}:${(averageDurationSeconds % 60).toString().padStart(2, '0')}`;
      
      const successfulCalls = currentCalls?.filter(call => 
        call.evaluation_result?.toLowerCase().includes('positiv') || 
        call.evaluation_result?.toLowerCase().includes('sucesso') ||
        call.evaluation_result?.toLowerCase().includes('bom') ||
        call.evaluation_result?.toLowerCase().includes('excelente')
      ).length || 0;
      const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

      // Previous period comparison
      const previousPeriodCalls = previousCalls?.length || 0;
      const previousPeriodDuration = previousCalls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const previousPeriodAvgDuration = previousPeriodCalls > 0 ? Math.round(previousPeriodDuration / previousPeriodCalls) : 0;
      const previousSuccessfulCalls = previousCalls?.filter(call => 
        call.evaluation_result?.toLowerCase().includes('positiv') || 
        call.evaluation_result?.toLowerCase().includes('sucesso') ||
        call.evaluation_result?.toLowerCase().includes('bom') ||
        call.evaluation_result?.toLowerCase().includes('excelente')
      ).length || 0;
      const previousPeriodSuccessRate = previousPeriodCalls > 0 ? Math.round((previousSuccessfulCalls / previousPeriodCalls) * 100) : 0;

      setDashboardData({
        totalCalls,
        averageDuration,
        successRate: `${successRate}%`,
        callsToday: todayCalls.length,
        previousMonthCalls: previousPeriodCalls,
        previousMonthDuration: previousPeriodAvgDuration,
        previousMonthSuccessRate: previousPeriodSuccessRate
      });
    };

    fetchDashboardData();
  }, [selectedOrganization?.id, selectedTimeFilter]);

  // Fetch chart data based on selected filter
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchChartData = async () => {
      const chartDataArray = [];
      const now = new Date();
      
      // Define periods based on filter
      let periods: { start: Date; end: Date; label: string }[] = [];
      
      switch (selectedTimeFilter) {
        case 'diario':
          // Last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            periods.push({
              start,
              end,
              label: date.toLocaleDateString('pt-BR', { weekday: 'short' })
            });
          }
          break;
        case 'semanal':
          // Last 8 weeks
          for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weekStart.setDate(now.getDate() - diff - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            
            // Format label as "dd/mm"
            const startDay = weekStart.getDate().toString().padStart(2, '0');
            const startMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0');
            const label = `${startDay}/${startMonth}`;
            
            periods.push({
              start: weekStart,
              end: weekEnd,
              label: label
            });
          }
          break;
        case 'mensal':
          // Last 7 months
          for (let i = 6; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            periods.push({
              start: monthDate,
              end: nextMonth,
              label: monthDate.toLocaleDateString('pt-BR', { month: 'short' })
            });
          }
          break;
        case 'anual':
          // Last 5 years
          for (let i = 4; i >= 0; i--) {
            const yearStart = new Date(now.getFullYear() - i, 0, 1);
            const yearEnd = new Date(now.getFullYear() - i + 1, 0, 1);
            periods.push({
              start: yearStart,
              end: yearEnd,
              label: yearStart.getFullYear().toString()
            });
          }
          break;
      }
      
        // Fetch data for each period
        for (const period of periods) {
          const { data: periodCalls } = await supabase
            .from('call_transcriptions')
            .select('id')
            .eq('organization_id', selectedOrganization.id)
            .gte('created_at', period.start.toISOString())
            .lt('created_at', period.end.toISOString());

          const totalCalls = periodCalls?.length || 0;

          chartDataArray.push({
            name: period.label,
            chamadas: totalCalls
          });
        }
      
      setChartData(chartDataArray);
    };

    fetchChartData();
  }, [selectedOrganization?.id, selectedTimeFilter]);

  // Fetch evaluation data for pie chart
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchEvaluationData = async () => {
      const { startDate, endDate } = getDateRange();
      
      const { data: calls } = await supabase
        .from('call_transcriptions')
        .select('evaluation_result')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (calls) {
        // Group evaluations by result
        const evaluationCounts: Record<string, number> = {};
        
        calls.forEach(call => {
          const result = call.evaluation_result || 'Não avaliado';
          evaluationCounts[result] = (evaluationCounts[result] || 0) + 1;
        });

        const pieData = Object.entries(evaluationCounts).map(([name, value]) => ({
          name,
          value,
          percentage: calls.length > 0 ? Math.round((value / calls.length) * 100) : 0
        }));

        setEvaluationData(pieData);
      }
    };

    fetchEvaluationData();
  }, [selectedOrganization?.id, selectedTimeFilter]);

  // Colors for pie chart
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--secondary))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--destructive))',
    'hsl(var(--warning))',
  ];

  // Count online agents
  const onlineAgents = Object.values(presenceData).filter(p => p.isOnlineInCurrentOrg).length;

  // Get performance title based on filter
  const getPerformanceTitle = () => {
    switch (selectedTimeFilter) {
      case 'diario':
        return 'Performance Diária';
      case 'semanal':
        return 'Performance Semanal';
      case 'mensal':
        return 'Performance Mensal';
      case 'anual':
        return 'Performance Anual';
      default:
        return 'Performance';
    }
  };

  // Get comparison period text
  const getComparisonText = () => {
    switch (selectedTimeFilter) {
      case 'diario':
        return 'ontem';
      case 'semanal':
        return 'semana anterior';
      case 'mensal':
        return 'mês anterior';
      case 'anual':
        return 'ano anterior';
      default:
        return 'período anterior';
    }
  };

  // Calculate changes from previous period
  const callsChange = dashboardData.previousMonthCalls > 0 
    ? `${dashboardData.totalCalls > dashboardData.previousMonthCalls ? '+' : ''}${Math.round(((dashboardData.totalCalls - dashboardData.previousMonthCalls) / dashboardData.previousMonthCalls) * 100)}%`
    : '+0%';

  const durationChange = dashboardData.previousMonthDuration > 0
    ? `${Math.round((dashboardData.averageDuration.split(':').reduce((acc, val, i) => acc + parseInt(val) * (i === 0 ? 60 : 1), 0) - dashboardData.previousMonthDuration) / 60)}min`
    : '0min';

  const successRateChange = dashboardData.previousMonthSuccessRate > 0
    ? `${parseInt(dashboardData.successRate) > dashboardData.previousMonthSuccessRate ? '+' : ''}${parseInt(dashboardData.successRate) - dashboardData.previousMonthSuccessRate}%`
    : '+0%';

  const comparisonText = getComparisonText();

  const stats = [
    {
      title: "Chamadas Realizadas",
      value: dashboardData.totalCalls.toString(),
      change: callsChange,
      icon: Phone,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      changeText: `vs ${comparisonText}`
    },
    {
      title: "Funcionários",
      value: onlineAgents.toString(),
      change: `de ${members.length} total`,
      icon: Users,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      changeText: "online agora"
    },
    {
      title: "Duração Média das Chamadas",
      value: dashboardData.averageDuration,
      change: durationChange,
      icon: Clock,
      iconBg: "bg-muted-foreground/10",
      iconColor: "text-muted-foreground",
      changeText: `vs ${comparisonText}`
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

      {/* Time Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {timeFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedTimeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeFilter(filter.value)}
              className={cn(
                "h-9",
                selectedTimeFilter === filter.value && "bg-primary text-primary-foreground"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-muted/30 border-border shadow-elegant hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                        <IconComponent className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-2">
                      {stat.value}
                    </p>
                    <p className={`text-sm font-medium ${stat.iconColor}`}>
                      {stat.change} {stat.changeText}
                    </p>
                  </div>
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
            <CardTitle className="text-foreground">{getPerformanceTitle()}</CardTitle>
            <CardDescription>
              Evolução de chamadas ao longo do tempo
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Results Pie Chart */}
      <div className="mt-8">
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Resultados das Avaliações</CardTitle>
            <CardDescription>
              Distribuição das avaliações das chamadas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evaluationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {evaluationData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} chamadas`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-col justify-center space-y-3">
                {evaluationData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-foreground font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">{entry.value}</span>
                      <span className="text-sm text-muted-foreground ml-2">({entry.percentage}%)</span>
                    </div>
                  </div>
                ))}
                {evaluationData.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma avaliação encontrada no período selecionado
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}