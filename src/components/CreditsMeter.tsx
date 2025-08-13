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
  const percentage = credits !== null ? Math.min((credits / maxCredits) * 100, 100) : 0;
  
  // Cor baseada na percentagem
  const getColorClass = () => {
    if (percentage > 60) return 'text-green-500';
    if (percentage > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => navigate('/dashboard/billing')}
        className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center justify-center bg-white border border-border ${
          isActive 
            ? 'border-primary shadow-sm' 
            : 'hover:border-primary/30'
        }`}
      >
        <div className="relative w-6 h-6">
          <div className={`w-full h-full rounded-full border-2 ${
            isActive ? 'border-primary-foreground/30' : 'border-muted'
          }`} />
          <div 
            className={`absolute inset-0 rounded-full ${
              percentage > 60 ? 'bg-green-500/20' : percentage > 30 ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}
          />
          <div 
            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3 bg-white border border-border ${
        isActive 
          ? 'border-primary shadow-sm' 
          : 'hover:border-primary/30'
      }`}
    >
      <div className="relative w-8 h-8 flex-shrink-0">
        <div className={`w-full h-full rounded-full border-2 ${
          isActive ? 'border-primary-foreground/30' : 'border-muted'
        }`} />
        <div 
          className={`absolute inset-0 rounded-full ${
            percentage > 60 ? 'bg-green-500/20' : percentage > 30 ? 'bg-yellow-500/20' : 'bg-red-500/20'
          }`}
        />
        <div 
          className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
            percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Taxa de uso
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {credits !== null ? `${credits.toLocaleString()} disponíveis` : 'Carregando...'}
        </p>
      </div>
    </button>
  );
}