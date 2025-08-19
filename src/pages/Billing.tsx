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
import { cn } from "@/lib/utils";
import PhoneInput from "@/components/PhoneInput";

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
  const [customMinutesError, setCustomMinutesError] = useState<string | null>(null);
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

  const validateCustomMinutes = (minutes: number) => {
    if (minutes === 0) {
      return null; // Permitir campo vazio durante digitação
    }
    
    if (minutes < 1000) {
      return "Quantidade mínima é 1000 minutos";
    }
    
    return null;
  };

  const updateCustomMinutesError = (errorMsg: string | null) => {
    setCustomMinutesError(errorMsg);
  };

  const handleCustomMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    const numValue = value === '' ? 0 : Number(value);
    
    setCustomMinutes(numValue);
    
    // Validar e atualizar erro em tempo real
    const validationError = validateCustomMinutes(numValue);
    updateCustomMinutesError(validationError);
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
            minutes: minutes,
            customerMSISDN: mpesaPhone,
            organizationId: userOrganization.id
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          
          // For FunctionsHttpError, we need to try to get the response body
          if (error.message && error.message.includes('non-2xx status code')) {
            try {
              // The error.context is a Response object, we need to read its body
              if (error.context && typeof error.context.json === 'function') {
                const errorResponse = await error.context.json();
                console.log('Parsed error response:', errorResponse);
                
                // Extract M-Pesa error details
                if (errorResponse && errorResponse.details && errorResponse.details.body && errorResponse.details.body.output_ResponseCode) {
                  const responseCode = errorResponse.details.body.output_ResponseCode;
                  let userMessage = 'Falha no pagamento';
                  
                  switch (responseCode) {
                    case 'INS-5':
                      userMessage = 'Transação cancelada pelo cliente.';
                      break;
                    case 'INS-6':
                      userMessage = 'Transação falhou. Tente novamente.';
                      break;
                    case 'INS-9':
                      userMessage = 'Tempo limite excedido. Verifique sua conexão e tente novamente.';
                      break;
                    case 'INS-10':
                      userMessage = 'Transação duplicada. Aguarde alguns minutos antes de tentar novamente.';
                      break;
                    case 'INS-15':
                      userMessage = 'Valor inválido. Verifique o montante e tente novamente.';
                      break;
                    case 'INS-16':
                      userMessage = 'Serviço temporariamente sobrecarregado. Tente novamente em alguns minutos.';
                      break;
                    case 'INS-17':
                      userMessage = 'Referência de transação inválida. Tente novamente.';
                      break;
                    case 'INS-20':
                      userMessage = 'Informações incompletas. Verifique os dados e tente novamente.';
                      break;
                    case 'INS-21':
                      userMessage = 'Dados inválidos. Verifique as informações inseridas.';
                      break;
                    case 'INS-23':
                      userMessage = 'Erro desconhecido. Contacte o suporte M-Pesa.';
                      break;
                    case 'INS-995':
                      userMessage = 'Problema com o perfil do cliente. Contacte o suporte M-Pesa.';
                      break;
                    case 'INS-996':
                      userMessage = 'Conta do cliente não está ativa. Contacte o suporte M-Pesa.';
                      break;
                    case 'INS-2002':
                      userMessage = 'Número de telefone inválido. Verifique o número e tente novamente.';
                      break;
                    case 'INS-2006':
                      userMessage = 'Saldo insuficiente em sua conta M-Pesa.';
                      break;
                    case 'INS-2051':
                      userMessage = 'Número MSISDN inválido. Verifique o número de telefone.';
                      break;
                    default:
                      userMessage = `Erro no processamento do pagamento (${responseCode}). Tente novamente ou contacte o suporte.`;
                  }
                  
                  toast({
                    title: "Erro no Pagamento M-Pesa",
                    description: userMessage,
                    variant: "destructive"
                  });
                  setIsProcessing(false);
                  return;
                } else {
                  // If we can't parse the specific error, show a generic M-Pesa error
                  toast({
                    title: "Erro no Pagamento M-Pesa",
                    description: "Erro no processamento do pagamento. Verifique seus dados e tente novamente.",
                    variant: "destructive"
                  });
                  setIsProcessing(false);
                  return;
                }
              }
            } catch (parseError) {
              console.error('Error parsing M-Pesa error response:', parseError);
              toast({
                title: "Erro no Pagamento M-Pesa",
                description: "Erro no processamento do pagamento. Tente novamente.",
                variant: "destructive"
              });
              setIsProcessing(false);
              return;
            }
          }
          throw error;
        }

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
          // Fallback for any non-success response that wasn't caught as an error
          toast({
            title: "Erro no Pagamento M-Pesa",
            description: "Erro no processamento do pagamento. Tente novamente ou contacte o suporte.",
            variant: "destructive"
          });
          return;
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
      <div className="p-6 space-y-8">
        {/* Main Card Shimmer */}
        <Card className="p-6 animate-fade-in">
          <div className="animate-pulse space-y-4">
            {/* Title shimmer */}
            <div className="h-7 bg-muted/60 rounded w-48"></div>
            
            {/* Stats grid shimmer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-muted/60 rounded w-24"></div>
                    <div className="h-4 w-4 bg-muted/60 rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-8 bg-muted/60 rounded w-16"></div>
                    <div className="h-3 bg-muted/40 rounded w-32"></div>
                    {i === 3 && <div className="h-2 bg-muted/40 rounded w-full mt-2"></div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        {/* Tabs shimmer */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {/* Tab list shimmer */}
          <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-muted/60 rounded px-4 w-32"></div>
            ))}
          </div>

          {/* Tab content shimmer */}
          <Card className="animate-scale-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <div className="space-y-2">
                <div className="h-6 bg-muted/60 rounded w-40"></div>
                <div className="h-4 bg-muted/40 rounded w-64"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Package grid shimmer */}
              <div className="space-y-3">
                <div className="h-5 bg-muted/60 rounded w-36"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div 
                      key={i} 
                      className="h-24 bg-muted/40 rounded-lg animate-pulse" 
                      style={{ animationDelay: `${500 + i * 50}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
              
              {/* Payment section shimmer */}
              <div className="space-y-4 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted/60 rounded w-32"></div>
                    <div className="h-10 bg-muted/40 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-5 bg-muted/60 rounded w-28"></div>
                    <div className="h-16 bg-muted/40 rounded"></div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <div className="h-11 bg-primary/20 rounded flex-1"></div>
                  <div className="h-11 bg-muted/40 rounded flex-1"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userOrganization) {
    return (
      <div className="p-6">
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
    <div className="p-6 space-y-8">
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
                  {MINUTE_PACKAGES.map((pkg, index) => {
                    const isSelected = selectedPackage === pkg.minutes && !useCustomAmount;
                    return (
                      <div
                        key={index}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20' 
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedPackage(pkg.minutes);
                          setUseCustomAmount(false);
                        }}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 text-center">
                          <div className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            Pacote {index + 1}
                          </div>
                          <div className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {pkg.minutes.toLocaleString()} Min
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pkg.price.toLocaleString()} MTS
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                      useCustomAmount 
                        ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    onClick={() => setUseCustomAmount(true)}
                  >
                    {useCustomAmount && (
                      <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 text-center">
                      <div className={`font-bold ${useCustomAmount ? 'text-primary' : 'text-foreground'}`}>
                        Personalizado
                      </div>
                      <div className={`text-lg font-semibold ${useCustomAmount ? 'text-primary' : 'text-foreground'}`}>
                        Escolher
                      </div>
                      <div className="text-sm text-muted-foreground">montante</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantidade personalizada */}
              {useCustomAmount && (
                <div>
                  <Label htmlFor="custom-minutes">Quantidade de Minutos</Label>
                  <div className="relative">
                    <Input
                      id="custom-minutes"
                      type="text"
                      value={customMinutes === 0 ? '' : customMinutes}
                      onChange={handleCustomMinutesChange}
                      placeholder="Mínimo: 1000 minutos"
                      className={cn(
                        customMinutesError ? "border-destructive focus:border-destructive focus-visible:ring-0" : ""
                      )}
                    />
                    {customMinutesError && (
                      <p className="text-sm text-destructive mt-1">{customMinutesError}</p>
                    )}
                  </div>
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
                <PhoneInput
                  value={mpesaPhone}
                  onChange={setMpesaPhone}
                  placeholder="258123456789"
                  className="mt-1"
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