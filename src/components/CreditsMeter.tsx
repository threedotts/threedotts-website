import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useCreditConsumption } from '@/hooks/useCreditConsumption';
import { Zap } from 'lucide-react';

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
        className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center justify-center group ${
          isActive 
            ? 'bg-primary/10 text-primary border-2 border-primary/20 shadow-lg' 
            : 'hover:bg-muted/60 border-2 border-transparent'
        }`}
      >
        <div className="relative w-10 h-10">
          <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-primary/5' : ''}`} />
          <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted/40 stroke-current"
              fill="none"
              strokeWidth="2.5"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${getColorClass()} stroke-current transition-all duration-300`}
              fill="none"
              strokeWidth="2.5"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className={`w-4 h-4 ${getColorClass()}`} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className={`w-full p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
        isActive 
          ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 shadow-lg' 
          : 'bg-card hover:bg-muted/40 border-2 border-border hover:border-primary/20'
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      )}
      
      <div className="relative flex items-center space-x-4">
        <div className="relative w-14 h-14">
          <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-primary/10' : 'bg-muted/20'} transition-colors duration-200`} />
          <svg className="w-14 h-14 transform -rotate-90 relative z-10" viewBox="0 0 36 36">
            <path
              className="text-muted/30 stroke-current"
              fill="none"
              strokeWidth="2"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${getColorClass()} stroke-current transition-all duration-500`}
              fill="none"
              strokeWidth="2.5"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center">
              <Zap className={`w-5 h-5 ${getColorClass()} mx-auto mb-1`} />
              <span className={`text-xs font-bold ${getColorClass()}`}>
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            Créditos
            {isActive && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
          </h3>
          <p className="text-xs text-muted-foreground">
            {credits !== null ? `${credits} de ${maxCredits}` : 'Carregando...'}
          </p>
          <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}