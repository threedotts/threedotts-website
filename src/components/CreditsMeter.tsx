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
        className={`w-full p-2 rounded-lg transition-all duration-200 flex items-center justify-center relative ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-md' 
            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className={`w-6 h-6 rounded-full border-2 ${
            isActive ? 'border-primary-foreground' : 'border-current'
          } transition-colors duration-200`}>
            <div 
              className={`w-full h-full rounded-full transition-all duration-300 ${
                percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ 
                clipPath: `polygon(0 ${100 - percentage}%, 100% ${100 - percentage}%, 100% 100%, 0% 100%)` 
              }}
            />
          </div>
          {isActive && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-foreground rounded-full" />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className={`w-full p-4 rounded-lg transition-all duration-200 group ${
        isActive 
          ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
          : 'bg-card hover:bg-muted/40 border border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className={`w-full h-full rounded-full border-3 ${
            isActive ? 'border-primary-foreground/30' : 'border-muted'
          } flex items-center justify-center transition-colors duration-200`}>
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted/20">
              <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
                  percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ height: `${percentage}%` }}
              />
            </div>
          </div>
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-foreground rounded-full" />
          )}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium text-sm ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
              Créditos
            </h3>
            {isActive && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />}
          </div>
          <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {credits !== null ? `${credits.toLocaleString()} disponíveis` : 'Carregando...'}
          </p>
          <div className={`w-full rounded-full h-1 mt-2 ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
            <div 
              className={`h-1 rounded-full transition-all duration-500 ${
                isActive 
                  ? 'bg-primary-foreground' 
                  : percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}