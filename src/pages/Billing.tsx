import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Wallet, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Settings,
  Plus,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditData {
  currentCredits: number;
  totalPurchased: number;
  totalUsed: number;
  lastTopUp: string | null;
}

interface BillingSettings {
  lowCreditThreshold: number;
  enableNotifications: boolean;
  autoTopUpEnabled: boolean;
  autoTopUpAmount: number;
  autoTopUpThreshold: number;
}

interface BillingHistoryItem {
  id: string;
  type: string;
  amount: number;
  cost: number | null;
  paymentMethod: string | null;
  description: string;
  status: string;
  createdAt: string;
}

export default function Billing() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState(1000);
  const [userOrganization, setUserOrganization] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
    }
  }, [user]);

  useEffect(() => {
    if (userOrganization) {
      fetchCreditData();
      fetchBillingSettings();
      fetchBillingHistory();
    }
  }, [userOrganization]);

  const fetchUserOrganization = async () => {
    try {
      // First check if user owns any organization
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user?.id);

      if (ownedOrgs && ownedOrgs.length > 0) {
        // Use the first organization owned by the user
        setUserOrganization(ownedOrgs[0]);
        return;
      }

      // If not owner, check if user is a member with admin role
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .in('role', ['admin'])
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching organization:', memberError);
        return;
      }

      if (membership?.organizations) {
        setUserOrganization(membership.organizations);
      }
      
      // Simulate current plan - in real app, this would come from database
      setCurrentPlan("Basic"); // Could be "Basic", "Pro", "Enterprise", or null
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCreditData = async () => {
    if (!userOrganization) return;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('organization_id', userOrganization.id)
        .maybeSingle();

      if (error) throw error;

      setCreditData({
        currentCredits: data?.current_credits || 0,
        totalPurchased: data?.total_credits_purchased || 0,
        totalUsed: data?.total_credits_used || 0,
        lastTopUp: data?.last_top_up_at || null
      });
    } catch (error) {
      console.error('Error fetching credit data:', error);
    }
  };

  const fetchBillingSettings = async () => {
    if (!userOrganization) return;

    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('organization_id', userOrganization.id)
        .maybeSingle();

      if (error) throw error;

      setBillingSettings({
        lowCreditThreshold: data?.low_credit_warning_threshold || 100,
        enableNotifications: data?.enable_low_credit_notifications || true,
        autoTopUpEnabled: data?.auto_top_up_enabled || false,
        autoTopUpAmount: data?.auto_top_up_amount || 1000,
        autoTopUpThreshold: data?.auto_top_up_threshold || 50
      });
    } catch (error) {
      console.error('Error fetching billing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!userOrganization) return;

    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('organization_id', userOrganization.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setBillingHistory(data.map(item => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        cost: item.cost,
        paymentMethod: item.payment_method,
        description: item.description,
        status: item.status,
        createdAt: item.created_at
      })));
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const updateBillingSettings = async (newSettings: Partial<BillingSettings>) => {
    if (!userOrganization || !billingSettings) return;

    try {
      const updatedSettings = { ...billingSettings, ...newSettings };
      
      const { error } = await supabase
        .from('billing_settings')
        .upsert({
          organization_id: userOrganization.id,
          low_credit_warning_threshold: updatedSettings.lowCreditThreshold,
          enable_low_credit_notifications: updatedSettings.enableNotifications,
          auto_top_up_enabled: updatedSettings.autoTopUpEnabled,
          auto_top_up_amount: updatedSettings.autoTopUpAmount,
          auto_top_up_threshold: updatedSettings.autoTopUpThreshold
        });

      if (error) throw error;

      setBillingSettings(updatedSettings);
      toast({
        title: "Configurações Atualizadas",
        description: "Suas preferências de cobrança foram salvas."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar configurações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleTopUp = async (method: 'mpesa' | 'bank_transfer') => {
    if (!userOrganization || topUpAmount <= 0) {
      toast({
        title: "Erro",
        description: "Valor inválido para recarga",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-top-up', {
        body: {
          amount: topUpAmount,
          paymentMethod: method,
          phoneNumber: method === 'mpesa' ? '' : undefined,
          accountDetails: method === 'bank_transfer' ? '' : undefined
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Recarga Iniciada",
          description: `Referência: ${data.paymentReference}`,
        });
        
        // Show payment instructions in a dialog or alert
        console.log('Payment instructions:', data.paymentInstructions);
        console.log('Next steps:', data.nextSteps);
        
        // Refresh billing history
        fetchBillingHistory();
      }
    } catch (error) {
      console.error('Top-up error:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar recarga. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas proprietários e administradores da organização podem visualizar informações de cobrança.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const usagePercentage = creditData ? 
    (creditData.totalUsed / Math.max(creditData.totalPurchased, 1)) * 100 : 0;

  const isLowCredit = creditData && billingSettings ? 
    creditData.currentCredits <= billingSettings.lowCreditThreshold : false;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Planos e Faturamento</h1>
        <p className="text-muted-foreground text-lg">Gerencie seu plano atual e créditos</p>
      </div>

      {/* Plano Atual */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
        <h2 className="text-2xl font-semibold mb-4">Plano Atual</h2>
        {currentPlan ? (
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-lg px-3 py-1">
                  {currentPlan}
                </Badge>
                <span className="text-muted-foreground">ativo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Seu plano atual está ativo e funcionando perfeitamente
              </p>
            </div>
            <Button variant="outline">
              Gerenciar Plano
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="space-y-3">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Nenhum plano ativo</h3>
              <p className="text-muted-foreground">
                Você não possui nenhum plano ativo no momento. Escolha um plano abaixo para começar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Planos Disponíveis */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plano Basic */}
          <Card className="relative border-2 hover:border-primary/20 transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Basic</CardTitle>
                <Badge variant="secondary">Mais Popular</Badge>
              </div>
              <CardDescription>Para equipes pequenas que estão começando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$200<span className="text-base font-normal text-muted-foreground">/mês</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  800 créditos mensais inclusos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  5 créditos diários extras
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Projetos privados
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Funções e permissões de usuário
                </li>
              </ul>
              <Button className="w-full" variant="default">
                {currentPlan === "Basic" ? "Plano Atual" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Pro */}
          <Card className="relative border-2 border-primary shadow-lg transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <CardDescription>Controles avançados para departamentos em crescimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$400<span className="text-base font-normal text-muted-foreground">/mês</span></div>
              <p className="text-sm text-muted-foreground">Tudo no Basic, além de:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  1.500 créditos mensais inclusos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  10 créditos diários extras
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  SSO
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Projetos Pessoais
                </li>
              </ul>
              <Button className="w-full" variant="default">
                {currentPlan === "Pro" ? "Plano Atual" : "Upgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Enterprise */}
          <Card className="relative border-2 hover:border-primary/20 transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <CardDescription>Para grandes organizações que precisam de flexibilidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">Faturamento flexível</div>
              <p className="text-sm text-muted-foreground">Tudo no Pro, além de:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Créditos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Suporte dedicado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Integrações personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Controle de acesso avançado
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                {currentPlan === "Enterprise" ? "Plano Atual" : "Agendar Demo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Atuais */}
      <div className="bg-muted/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Uso Atual</h2>
        {isLowCredit && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu saldo de créditos está baixo ({creditData?.currentCredits} créditos restantes). 
              Considere fazer uma recarga para evitar interrupção do serviço.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Atuais</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData?.currentCredits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para uso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditData?.totalUsed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Uso total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usagePercentage.toFixed(1)}%</div>
              <Progress value={usagePercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="topup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topup">Recarregar</TabsTrigger>
          <TabsTrigger value="history">Histórico de Cobrança</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="topup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Créditos</CardTitle>
              <CardDescription>
                Escolha seu método de pagamento preferido para recarregar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Quantidade (Créditos)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  placeholder="Digite a quantidade de créditos"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleTopUp('mpesa')} 
                  className="gap-2 h-20 flex-col"
                  variant="outline"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Pagar com M-Pesa</span>
                </Button>
                
                <Button 
                  onClick={() => handleTopUp('bank_transfer')} 
                  className="gap-2 h-20 flex-col"
                  variant="outline"
                >
                  <Wallet className="h-6 w-6" />
                  <span>Transferência Bancária</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma transação encontrada
                  </p>
                ) : (
                  billingHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'top_up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'top_up' ? <Plus className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'top_up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'top_up' ? '+' : ''}{transaction.amount} credits
                        </p>
                        {transaction.cost && (
                          <p className="text-sm text-muted-foreground">
                            KES {transaction.cost}
                          </p>
                        )}
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferências de Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="threshold">Limite de Aviso de Créditos Baixos</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={billingSettings?.lowCreditThreshold || 100}
                    onChange={(e) => updateBillingSettings({ 
                      lowCreditThreshold: Number(e.target.value) 
                    })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Seja notificado quando os créditos ficarem abaixo desta quantidade
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ativar Notificações de Créditos Baixos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas quando seus créditos estiverem acabando
                    </p>
                  </div>
                  <Switch
                    checked={billingSettings?.enableNotifications || false}
                    onCheckedChange={(checked) => updateBillingSettings({ 
                      enableNotifications: checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recarga Automática (Em Breve)</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar créditos automaticamente quando o saldo estiver baixo
                    </p>
                  </div>
                  <Switch
                    checked={false}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}