import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        className="w-full p-2 rounded-lg hover:bg-muted/60 transition-colors duration-200 flex items-center justify-center"
      >
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted stroke-current"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${getColorClass()} stroke-current`}
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${getColorClass()}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className="w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors duration-200"
    >
      <div className="flex items-center space-x-4">
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted stroke-current"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${getColorClass()} stroke-current`}
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${getColorClass()}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        
        <div className="flex-1 text-left">
          <h3 className="font-medium text-foreground text-sm">Créditos</h3>
          <p className="text-xs text-muted-foreground">
            {credits !== null ? `${credits} de ${maxCredits}` : 'Carregando...'}
          </p>
        </div>
      </div>
    </button>
  );
}