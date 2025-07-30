import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      value: selectedOrganization?.members_count?.toString() || "0",
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

  // Mock data for line chart
  const chartData = [
    { name: 'Jan', chamadas: 400, conversoes: 340 },
    { name: 'Fev', chamadas: 300, conversoes: 280 },
    { name: 'Mar', chamadas: 500, conversoes: 420 },
    { name: 'Abr', chamadas: 680, conversoes: 590 },
    { name: 'Mai', chamadas: 590, conversoes: 520 },
    { name: 'Jun', chamadas: 700, conversoes: 630 },
    { name: 'Jul', chamadas: 820, conversoes: 750 },
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
              <span className="text-2xl font-bold text-primary-glow">247</span>
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
                    dataKey="conversoes" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 5 }}
                    name="Conversões"
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