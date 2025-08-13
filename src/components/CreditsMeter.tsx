import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useCreditConsumption } from '@/hooks/useCreditConsumption';

interface CreditsMeterProps {
  organizationId: string;
  isCollapsed?: boolean;
}

export function CreditsMeter({ organizationId, isCollapsed }: CreditsMeterProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const { checkCreditBalance } = useCreditConsumption();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/dashboard/billing';

  useEffect(() => {
    const fetchCredits = async () => {
      const balance = await checkCreditBalance(organizationId);
      setCredits(balance);
    };

    if (organizationId) {
      fetchCredits();
    }
  }, [organizationId, checkCreditBalance]);

  const maxCredits = 1000; // Assumindo um máximo de 1000 créditos
  const usedCredits = maxCredits - (credits || 0);
  const usagePercentage = credits !== null ? Math.min((usedCredits / maxCredits) * 100, 100) : 0;

  if (isCollapsed) {
    return (
      <button
        onClick={() => navigate('/dashboard/billing')}
        className={`w-full p-2 rounded-lg transition-all duration-200 flex items-center justify-center bg-card border ${
          isActive 
            ? 'border-primary shadow-sm' 
            : 'border-border hover:border-primary/30'
        }`}
      >
        <div className="relative w-6 h-6">
          <Progress 
            value={usagePercentage} 
            className="w-full h-1.5 rotate-90 origin-center"
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3 bg-card border ${
        isActive 
          ? 'border-primary shadow-sm' 
          : 'border-border hover:border-primary/30'
      }`}
    >
      <div className="relative w-8 h-8 flex-shrink-0">
        <Progress 
          value={usagePercentage} 
          className="w-full h-2"
        />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Taxa de Uso
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {credits !== null ? `${usagePercentage.toFixed(1)}%` : 'Carregando...'}
        </p>
      </div>
    </button>
  );
}