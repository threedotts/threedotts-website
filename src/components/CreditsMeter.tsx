import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface CreditsMeterProps {
  organizationId: string;
  isCollapsed?: boolean;
}

interface CreditData {
  currentCredits: number;
  totalPurchased: number;
  totalUsed: number;
}

export function CreditsMeter({ organizationId, isCollapsed }: CreditsMeterProps) {
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/dashboard/billing';

  useEffect(() => {
    const fetchCreditData = async () => {
      try {
        const { data } = await supabase
          .from('user_credits')
          .select('current_credits, total_credits_purchased, total_credits_used')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (data) {
          setCreditData({
            currentCredits: data.current_credits || 0,
            totalPurchased: data.total_credits_purchased || 0,
            totalUsed: data.total_credits_used || 0
          });
        }
      } catch (error) {
        console.error('Error fetching credit data:', error);
      }
    };

    if (organizationId) {
      fetchCreditData();
    }
  }, [organizationId]);

  // Usar a mesma lógica da página de billing
  const usagePercentage = creditData ? 
    (creditData.totalUsed / Math.max(creditData.totalPurchased, 1)) * 100 : 0;

  if (isCollapsed) {
    return (
      <button
        onClick={() => navigate('/dashboard/billing')}
        className="w-full p-2 rounded-lg transition-all duration-200 flex flex-col items-center bg-card border border-border hover:border-border"
      >
        <TrendingUp className="w-4 h-4 text-muted-foreground mb-1" />
        <div className="w-full h-1 bg-muted rounded-full">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="w-full p-4 rounded-lg border border-border space-y-3 bg-card">
      {/* Header do Plano */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentPlan ? (
            <Badge variant="default" className="text-xs font-medium">
              {currentPlan}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Nenhum plano
            </Badge>
          )}
          
        </div>
      </div>

      {/* Métricas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Créditos atuais</span>
          <span className="font-medium">{creditData?.currentCredits || 0}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taxa de uso</span>
            <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Botão Gerenciar */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/dashboard/billing')}
        className="w-full h-8 text-xs"
      >
        Gerenciar
      </Button>
    </div>
  );
}