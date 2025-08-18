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
import { 
  CreditCard, 
  Wallet, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Settings,
  Plus,
  History,
  Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MinuteData {
  currentMinutes: number;
  totalPurchased: number;
  totalUsed: number;
  lastTopUp: string | null;
}

interface BillingSettings {
  lowMinuteThreshold: number;
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

// Constantes para preços
const PRICE_PER_MINUTE = 23; // 23 MTS por minuto

// Pacotes pré-definidos
const MINUTE_PACKAGES = [
  { minutes: 1000, price: 1000 * PRICE_PER_MINUTE },
  { minutes: 2500, price: 2500 * PRICE_PER_MINUTE },
  { minutes: 5000, price: 5000 * PRICE_PER_MINUTE },
  { minutes: 7500, price: 7500 * PRICE_PER_MINUTE },
  { minutes: 10000, price: 10000 * PRICE_PER_MINUTE }
];

export default function Billing() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [minuteData, setMinuteData] = useState<MinuteData | null>(null);
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<number>(1000);
  const [customMinutes, setCustomMinutes] = useState(1000);
  const [userOrganization, setUserOrganization] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

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
      fetchMinuteData();
      fetchBillingSettings();
      fetchBillingHistory();
    }
  }, [userOrganization]);

  const fetchUserOrganization = async () => {
    try {
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user?.id);

      if (ownedOrgs && ownedOrgs.length > 0) {
        setUserOrganization(ownedOrgs[0]);
        return;
      }

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
      
      setCurrentPlan(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMinuteData = async () => {
    if (!userOrganization) return;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('organization_id', userOrganization.id)
        .maybeSingle();

      if (error) throw error;

      setMinuteData({
        currentMinutes: data?.current_credits || 0,
        totalPurchased: data?.total_credits_purchased || 0,
        totalUsed: data?.total_credits_used || 0,
        lastTopUp: data?.last_top_up_at || null
      });
    } catch (error) {
      console.error('Error fetching minute data:', error);
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
        lowMinuteThreshold: data?.low_credit_warning_threshold || 100,
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
          low_credit_warning_threshold: updatedSettings.lowMinuteThreshold,
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

  const getSelectedMinutes = () => useCustomAmount ? customMinutes : selectedPackage;
  const getTotalPrice = () => getSelectedMinutes() * PRICE_PER_MINUTE;

  const handleTopUp = async (method: 'mpesa' | 'bank_transfer') => {
    const minutes = getSelectedMinutes();
    const totalPrice = getTotalPrice();
    
    if (!userOrganization || minutes <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade inválida de minutos",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (method === 'mpesa') {
        if (!mpesaPhone) {
          toast({
            title: "Número Obrigatório",
            description: "Por favor, insira seu número de telefone M-Pesa.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('process-mpesa-payment', {
          body: {
            amount: totalPrice.toString(),
            customerMSISDN: mpesaPhone,
            organizationId: userOrganization.id
          }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Pagamento Bem-sucedido",
            description: `${minutes} minutos foram adicionados à sua conta.`,
          });
          
          setMpesaPhone('');
          
          // Refresh data after successful payment
          fetchMinuteData();
          fetchBillingHistory();
        } else {
          throw new Error(data.error || 'Falha no pagamento');
        }
      } else {
        // Handle bank transfer
        const { data, error } = await supabase.functions.invoke('process-top-up', {
          body: {
            amount: minutes,
            paymentMethod: method,
            phoneNumber: '',
            accountDetails: method === 'bank_transfer' ? '' : undefined
          }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Recarga Iniciada",
            description: `Referência: ${data.paymentReference}`,
          });
          
          fetchBillingHistory();
        }
      }
    } catch (error) {
      console.error('Top-up error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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

  const usagePercentage = minuteData ? 
    (minuteData.totalUsed / Math.max(minuteData.totalPurchased, 1)) * 100 : 0;

  const isLowMinutes = minuteData && billingSettings ? 
    minuteData.currentMinutes <= billingSettings.lowMinuteThreshold : false;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Tarifas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Tarifas das Chamadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">23 MTS/MIN</div>
            <div className="text-sm text-muted-foreground">(0.35 USD/MIN)</div>
            <div className="text-xs text-muted-foreground mt-2">Base TOP UP</div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Atuais */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Minutos de Chamada</h2>
        {isLowMinutes && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Seu saldo de minutos está baixo ({minuteData?.currentMinutes} minutos restantes). 
              Considere fazer uma recarga para evitar interrupção do serviço.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minutos Atuais</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{minuteData?.currentMinutes || 0}</div>
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
              <div className="text-2xl font-bold">{minuteData?.totalUsed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Minutos consumidos
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
      </Card>

      <Tabs defaultValue="topup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topup">Recarregar Minutos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="topup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacotes de Minutos</CardTitle>
              <CardDescription>
                Escolha um pacote ou quantidade personalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pacotes pré-definidos */}
              <div>
                <Label className="text-base font-medium">Pacotes Disponíveis</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {MINUTE_PACKAGES.map((pkg, index) => (
                    <Button
                      key={index}
                      variant={selectedPackage === pkg.minutes && !useCustomAmount ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col gap-2"
                      onClick={() => {
                        setSelectedPackage(pkg.minutes);
                        setUseCustomAmount(false);
                      }}
                    >
                      <div className="font-bold">Pacote {index + 1}</div>
                      <div className="text-lg font-semibold">{pkg.minutes.toLocaleString()} Min</div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.price.toLocaleString()} MTS
                      </div>
                    </Button>
                  ))}
                  <Button
                    variant={useCustomAmount ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setUseCustomAmount(true)}
                  >
                    <div className="font-bold">Personalizado</div>
                    <div className="text-lg font-semibold">Escolher</div>
                    <div className="text-sm text-muted-foreground">montante</div>
                  </Button>
                </div>
              </div>

              {/* Quantidade personalizada */}
              {useCustomAmount && (
                <div>
                  <Label htmlFor="custom-minutes">Quantidade de Minutos</Label>
                  <Input
                    id="custom-minutes"
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Number(e.target.value))}
                    placeholder="Digite a quantidade de minutos"
                    min="1"
                  />
                </div>
              )}

              {/* Resumo do pagamento */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span>Minutos selecionados:</span>
                    <span className="font-bold">{getSelectedMinutes().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Preço por minuto:</span>
                    <span>{PRICE_PER_MINUTE} MTS</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total a pagar:</span>
                      <span className="text-primary">{getTotalPrice().toLocaleString()} MTS</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Número M-Pesa */}
              <div>
                <Label htmlFor="mpesa-phone">Número de Telefone M-Pesa</Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="258843330333"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                />
              </div>
              
              {/* Botões de pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleTopUp('mpesa')} 
                  className="gap-2 h-20 flex-col"
                  variant="default"
                  disabled={!getSelectedMinutes() || !mpesaPhone || isProcessing}
                  size="lg"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>{isProcessing ? "Processando..." : "Pagar com M-Pesa"}</span>
                  <span className="text-sm">{getTotalPrice().toLocaleString()} MTS</span>
                </Button>
                
                <Button 
                  onClick={() => handleTopUp('bank_transfer')} 
                  className="gap-2 h-20 flex-col"
                  variant="outline"
                  disabled={!getSelectedMinutes() || isProcessing}
                  size="lg"
                >
                  <Wallet className="h-6 w-6" />
                  <span>{isProcessing ? "Processando..." : "Transferência Bancária"}</span>
                  <span className="text-sm">{getTotalPrice().toLocaleString()} MTS</span>
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
                          {transaction.type === 'top_up' ? '+' : ''}{transaction.amount} minutos
                        </p>
                        {transaction.cost && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.cost} MTS
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
                  <Label htmlFor="threshold">Limite de Aviso de Minutos Baixos</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={billingSettings?.lowMinuteThreshold || 100}
                    onChange={(e) => updateBillingSettings({ 
                      lowMinuteThreshold: Number(e.target.value) 
                    })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Seja notificado quando os minutos ficarem abaixo desta quantidade
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ativar Notificações de Minutos Baixos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas quando seus minutos estiverem acabando
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
                      Adicionar minutos automaticamente quando o saldo estiver baixo
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