import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, TrendingUp, Clock, Target, DollarSign, Timer, UserCheck, MapPin, Calendar, BarChart3, PhoneCall } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useConversationPolling } from '@/hooks/useConversationPolling';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

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
    previousMonthSuccessRate: 0,
    // Análise Temporal
    peakHour: "N/A",
    mostActiveDayOfWeek: "N/A",
    avgTimeBetweenCalls: "N/A"
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('mensal');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const location = useLocation();
  
  const { presenceData, fetchPresenceData } = useUserPresence(selectedOrganization?.id);
  const { activeCallsByAgent, isLoading: pollingLoading } = useConversationPolling({
    selectedOrganization: selectedOrganization && agentIds.length > 0 ? { 
      id: selectedOrganization.id, 
      agent_id: agentIds
    } : undefined,
    enabled: !!selectedOrganization && agentIds.length > 0 && location.pathname === '/dashboard'
  });

  // Calculate total active calls from all agents
  const totalActiveCalls = Object.values(activeCallsByAgent).reduce((total, count) => total + count, 0);

  // Time filter options
  const timeFilters = [
    { value: 'diario', label: 'Diário' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' },
    { value: 'personalizado', label: 'Personalizado' }
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
      case 'personalizado':
        if (customDateRange?.from && customDateRange?.to) {
          startDate = new Date(customDateRange.from);
          endDate = new Date(customDateRange.to);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  // Fetch organization agent_ids
  useEffect(() => {
    if (!selectedOrganization?.id) return;
    
    console.log('Fetching agent IDs for organization:', selectedOrganization.name, selectedOrganization.id);

    const fetchAgentIds = async () => {
      // Get agent_ids from the organization table
      const { data: orgData } = await supabase
        .from('organizations')
        .select('agent_id')
        .eq('id', selectedOrganization.id)
        .single();

      if (orgData?.agent_id && Array.isArray(orgData.agent_id) && orgData.agent_id.length > 0) {
        // Filter out empty or invalid agent IDs
        const validAgentIds = orgData.agent_id.filter(id => 
          id && typeof id === 'string' && id.trim() !== ''
        );
        
        if (validAgentIds.length > 0) {
          console.log('Found valid agent IDs for org', selectedOrganization.id, ':', validAgentIds);
          setAgentIds(validAgentIds);
        } else {
          console.log('No valid agent IDs found for organization:', selectedOrganization.id);
          setAgentIds([]);
        }
      } else {
        console.log('No agent IDs found for organization:', selectedOrganization.id);
        setAgentIds([]);
      }
    };

    fetchAgentIds();
  }, [selectedOrganization?.id]);

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
    
    console.log('Fetching dashboard data for organization:', selectedOrganization.name, selectedOrganization.id);

    const fetchDashboardData = async () => {
      const { startDate, endDate } = getDateRange();
      
      // Get current period calls
      const { data: currentCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result, date, created_at, customer')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      console.log('Current calls for org', selectedOrganization.id, ':', currentCalls?.length || 0, 'calls');

      // Get previous period for comparison (same duration, shifted back)
      const periodDuration = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodDuration);
      const prevEndDate = new Date(startDate.getTime());

      const { data: previousCalls } = await supabase
        .from('call_transcriptions')
        .select('duration, evaluation_result, customer')
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

      // Análise Temporal
      const hourCounts: Record<number, number> = {};
      const dayOfWeekCounts: Record<number, number> = {};
      const customerCalls: Record<string, Date[]> = {};

      currentCalls?.forEach(call => {
        const callDate = new Date(call.created_at);
        const hour = callDate.getHours();
        const dayOfWeek = callDate.getDay();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
        
        // Track customer calls for time between calls analysis - using agent as customer proxy
        const customerKey = call.customer || `cliente_${Math.floor(Math.random() * 100)}`;
        if (!customerCalls[customerKey]) customerCalls[customerKey] = [];
        customerCalls[customerKey].push(callDate);
      });

      // Only calculate peak hour and most active day if there are calls
      const peakHour = Object.keys(hourCounts).length > 0 
        ? Object.keys(hourCounts).reduce((a, b) => hourCounts[Number(a)] > hourCounts[Number(b)] ? a : b, '0')
        : null;
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const mostActiveDayOfWeek = Object.keys(dayOfWeekCounts).length > 0
        ? Object.keys(dayOfWeekCounts).reduce((a, b) => 
            dayOfWeekCounts[Number(a)] > dayOfWeekCounts[Number(b)] ? a : b, '0'
          )
        : null;

      // Calculate average time between calls
      let totalTimeBetween = 0;
      let callIntervals = 0;
      Object.values(customerCalls).forEach(dates => {
        if (dates.length > 1) {
          dates.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < dates.length; i++) {
            totalTimeBetween += dates[i].getTime() - dates[i-1].getTime();
            callIntervals++;
          }
        }
      });
      const avgTimeBetweenCallsHours = callIntervals > 0 ? Math.round(totalTimeBetween / callIntervals / (1000 * 60 * 60)) : 0;


      setDashboardData({
        totalCalls,
        averageDuration,
        successRate: `${successRate}%`,
        callsToday: todayCalls.length,
        previousMonthCalls: previousPeriodCalls,
        previousMonthDuration: previousPeriodAvgDuration,
        previousMonthSuccessRate: previousPeriodSuccessRate,
        // Análise Temporal
        peakHour: peakHour ? `${peakHour}:00h` : "N/A",
        mostActiveDayOfWeek: mostActiveDayOfWeek ? dayNames[Number(mostActiveDayOfWeek)] : "N/A",
        avgTimeBetweenCalls: avgTimeBetweenCallsHours > 0 ? `${avgTimeBetweenCallsHours}h` : "N/A"
      });
    };

    fetchDashboardData();
  }, [selectedOrganization?.id, selectedTimeFilter, customDateRange]);

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
        case 'personalizado':
          if (customDateRange?.from && customDateRange?.to) {
            // For custom range, divide into daily periods
            const startDate = new Date(customDateRange.from);
            const endDate = new Date(customDateRange.to);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // If range is more than 30 days, group by weeks, otherwise by days
            if (totalDays > 30) {
              // Group by weeks
              let currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const weekEnd = new Date(currentDate);
                weekEnd.setDate(currentDate.getDate() + 6);
                if (weekEnd > endDate) {
                  weekEnd.setTime(endDate.getTime());
                }
                
                periods.push({
                  start: new Date(currentDate),
                  end: weekEnd,
                  label: `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
                });
                
                currentDate.setDate(currentDate.getDate() + 7);
              }
            } else {
              // Group by days
              let currentDate = new Date(startDate);
              while (currentDate <= endDate) {
                const dayEnd = new Date(currentDate);
                dayEnd.setHours(23, 59, 59, 999);
                
                periods.push({
                  start: new Date(currentDate),
                  end: dayEnd,
                  label: `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
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
  }, [selectedOrganization?.id, selectedTimeFilter, customDateRange]);

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
  }, [selectedOrganization?.id, selectedTimeFilter, customDateRange]);

  // Fetch hourly distribution data
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchHourlyData = async () => {
      const { startDate, endDate } = getDateRange();
      
      const { data: calls } = await supabase
        .from('call_transcriptions')
        .select('created_at')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (calls) {
        const hourCounts: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
          hourCounts[i] = 0;
        }

        calls.forEach(call => {
          const hour = new Date(call.created_at).getHours();
          hourCounts[hour]++;
        });

        const hourlyArray = Object.entries(hourCounts).map(([hour, count]) => ({
          hour: `${hour}:00`,
          chamadas: count
        }));

        setHourlyData(hourlyArray);
      }
    };

    fetchHourlyData();
  }, [selectedOrganization?.id, selectedTimeFilter, customDateRange]);

  // Fetch weekly distribution data  
  useEffect(() => {
    if (!selectedOrganization?.id) return;

    const fetchWeeklyData = async () => {
      const { startDate, endDate } = getDateRange();
      
      const { data: calls } = await supabase
        .from('call_transcriptions')
        .select('created_at')
        .eq('organization_id', selectedOrganization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (calls) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayCounts: Record<number, number> = {};
        for (let i = 0; i < 7; i++) {
          dayCounts[i] = 0;
        }

        calls.forEach(call => {
          const dayOfWeek = new Date(call.created_at).getDay();
          dayCounts[dayOfWeek]++;
        });

        const weeklyArray = Object.entries(dayCounts).map(([day, count]) => ({
          day: dayNames[Number(day)],
          chamadas: count
        }));

        setWeeklyData(weeklyArray);
      }
    };

    fetchWeeklyData();
  }, [selectedOrganization?.id, selectedTimeFilter, customDateRange]);


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

  // Calculate changes from previous period with better messaging
  const getCallsChangeMessage = () => {
    if (dashboardData.previousMonthCalls === 0) return { message: 'Primeira medição', color: 'text-muted-foreground' };
    
    const percentChange = Math.round(((dashboardData.totalCalls - dashboardData.previousMonthCalls) / dashboardData.previousMonthCalls) * 100);
    
    if (percentChange > 0) {
      return { 
        message: `↑ ${percentChange}% mais chamadas que no ${comparisonText}`, 
        color: 'text-green-600' 
      };
    } else if (percentChange < 0) {
      return { 
        message: `↓ ${Math.abs(percentChange)}% menos chamadas que no ${comparisonText}`, 
        color: 'text-red-600' 
      };
    } else {
      return { 
        message: `Mesmo número de chamadas do ${comparisonText}`, 
        color: 'text-muted-foreground' 
      };
    }
  };

  const getDurationChangeMessage = () => {
    if (dashboardData.previousMonthDuration === 0) return { message: 'Primeira medição', color: 'text-muted-foreground' };
    
    const currentDurationSeconds = dashboardData.averageDuration.split(':').reduce((acc, val, i) => acc + parseInt(val) * (i === 0 ? 60 : 1), 0);
    const diffMinutes = Math.round((currentDurationSeconds - dashboardData.previousMonthDuration) / 60);
    
    if (diffMinutes > 0) {
      return { 
        message: `↑ ${diffMinutes}min mais longa que no ${comparisonText}`, 
        color: 'text-red-600' 
      };
    } else if (diffMinutes < 0) {
      return { 
        message: `↓ ${Math.abs(diffMinutes)}min mais rápida que no ${comparisonText}`, 
        color: 'text-green-600' 
      };
    } else {
      return { 
        message: `Mesma duração do ${comparisonText}`, 
        color: 'text-muted-foreground' 
      };
    }
  };

  const comparisonText = getComparisonText();
  const callsChangeInfo = getCallsChangeMessage();
  const durationChangeInfo = getDurationChangeMessage();

  const stats = [
    {
      title: "Chamadas Realizadas",
      value: (dashboardData.totalCalls || 0).toString(),
      change: callsChangeInfo.message,
      icon: Phone,
      iconBg: "bg-primary/10",
      iconColor: callsChangeInfo.color,
      changeText: ""
    },
    {
      title: "Funcionários",
      value: `${onlineAgents}/${members.length}`,
      change: `${onlineAgents} online`,
      icon: Users,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      changeText: "de " + members.length + " total"
    },
    {
      title: "Duração Média das Chamadas",
      value: dashboardData.averageDuration || "0:00",
      change: durationChangeInfo.message,
      icon: Clock,
      iconBg: "bg-muted-foreground/10",
      iconColor: durationChangeInfo.color,
      changeText: ""
    }
  ];

  // Additional stats for new metrics
  const temporalStats = [
    {
      title: "Horário de Pico",
      value: dashboardData.peakHour,
      change: "Maior volume de chamadas",
      icon: Clock,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600"
    },
    {
      title: "Dia Mais Ativo",
      value: dashboardData.mostActiveDayOfWeek,
      change: "Da semana",
      icon: Calendar,
      iconBg: "bg-gray-100", 
      iconColor: "text-gray-600"
    },
    {
      title: "Tempo Entre Chamadas",
      value: dashboardData.avgTimeBetweenCalls,
      change: "Média por cliente",
      icon: Timer,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600"
    }
  ];


  // Generate description for the time period
  const getTimeFilterDescription = () => {
    const { startDate, endDate } = getDateRange();
    
    switch (selectedTimeFilter) {
      case 'diario':
        return startDate.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'semanal':
        const endOfWeek = new Date(startDate);
        endOfWeek.setDate(startDate.getDate() + 6);
        return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      case 'mensal':
        return startDate.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
      case 'anual':
        return startDate.getFullYear().toString();
      case 'personalizado':
        if (customDateRange?.from && customDateRange?.to) {
          return `${customDateRange.from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${customDateRange.to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        }
        return 'Período personalizado';
      default:
        return 'Período selecionado';
    }
  };

  // Generate specific descriptions for hourly and weekly charts
  const getHourlyChartDescription = () => {
    const periodDesc = getTimeFilterDescription();
    switch (selectedTimeFilter) {
      case 'diario':
        return `Distribuição por hora do dia ${periodDesc}`;
      case 'semanal':
        return `Soma total de chamadas por hora de todos os dias da semana (${periodDesc})`;
      case 'mensal':
        return `Soma total de chamadas por hora de todos os dias do mês (${periodDesc})`;
      case 'anual':
        return `Soma total de chamadas por hora de todos os dias do ano ${periodDesc}`;
      case 'personalizado':
        return `Soma total de chamadas por hora de todos os dias do período (${periodDesc})`;
      default:
        return `Soma total de chamadas por hora do período selecionado`;
    }
  };

  const getWeeklyChartDescription = () => {
    const periodDesc = getTimeFilterDescription();
    switch (selectedTimeFilter) {
      case 'diario':
        return `Dia da semana de ${periodDesc}`;
      case 'semanal':
        return `Distribuição por dia da semana (${periodDesc})`;
      case 'mensal':
        return `Soma de todas as segundas, terças, etc. do mês (${periodDesc})`;
      case 'anual':
        return `Soma de todas as segundas, terças, etc. do ano ${periodDesc}`;
      case 'personalizado':
        return `Soma de todas as segundas, terças, etc. do período (${periodDesc})`;
      default:
        return `Soma por dia da semana do período selecionado`;
    }
  };

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
        <div className="flex flex-wrap gap-2 items-center">
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
          
          {/* Custom Date Range Picker */}
          {selectedTimeFilter === 'personalizado' && (
            <DateRangePicker
              value={customDateRange}
              onChange={setCustomDateRange}
              placeholder="Selecione o intervalo"
              className="ml-2"
            />
          )}
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
                      <div className="p-2 rounded-lg bg-background border border-border">
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

      {/* Active Calls by Agent Section */}
      <div className="mt-8 mb-8">
        <Card className="bg-gradient-card border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">
              Chamadas Ativas por Agente
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real das chamadas em andamento
            </CardDescription>
          </CardHeader>
           <CardContent>
            {agentIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PhoneCall className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum agente configurado</p>
                <p className="text-sm">Configure agentes AI para esta organização para ver chamadas ativas</p>
              </div>
            ) : pollingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 bg-muted rounded w-8"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(activeCallsByAgent).length > 0 ? (
                  Object.entries(activeCallsByAgent).map(([agentName, count]) => (
                    <div key={agentName} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${count > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'} rounded-full`}></div>
                        <span className="text-foreground font-medium">{agentName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${count > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {count}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count === 1 ? 'chamada ativa' : 'chamadas ativas'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="mx-auto h-12 w-12 opacity-50 mb-4" />
                    <p className="text-lg font-medium mb-2">Nenhuma chamada ativa</p>
                    <p className="text-sm">Todas as chamadas foram concluídas</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="text-foreground font-medium">Chamadas Ativas</span>
              </div>
              <span className="text-2xl font-bold text-primary">{totalActiveCalls}</span>
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
                    dot={{ 
                      fill: 'hsl(var(--primary))', 
                      strokeWidth: 2, 
                      r: 6,
                      stroke: 'hsl(var(--background))'
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: 'hsl(var(--primary))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
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
                      cornerRadius={8}
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

      {/* Análise Temporal */}
      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold">Análise Temporal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {temporalStats.map((stat, index) => (
            <Card key={index} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={cn("p-2 rounded-full", stat.iconBg)}>
                    <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Horário */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Horário</CardTitle>
              <CardDescription>{getHourlyChartDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))"
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    cursor={{ fill: 'hsl(0 0% 88%)' }}
                  />
                  <Bar 
                    dataKey="chamadas" 
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Dia da Semana */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Semanal</CardTitle>
              <CardDescription>{getWeeklyChartDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))"
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="day" 
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    cursor={{ fill: 'hsl(0 0% 88%)' }}
                  />
                  <Bar 
                    dataKey="chamadas" 
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}