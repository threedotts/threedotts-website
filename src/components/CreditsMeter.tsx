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
  
  // Cor baseada na percentagem de uso
  const getColorClass = () => {
    if (usagePercentage < 40) return 'text-green-500';
    if (usagePercentage < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    if (usagePercentage < 40) return '#10b981'; // green-500
    if (usagePercentage < 70) return '#f59e0b'; // yellow-500
    return '#ef4444'; // red-500
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => navigate('/dashboard/billing')}
        className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center justify-center bg-gray-50 border border-gray-200 ${
          isActive 
            ? 'border-primary shadow-sm' 
            : 'hover:border-gray-300'
        }`}
      >
        <div className="relative w-6 h-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-300"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={getProgressColor()}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 10}`}
              strokeDashoffset={`${2 * Math.PI * 10 * (1 - usagePercentage / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate('/dashboard/billing')}
      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3 bg-gray-50 border border-gray-200 ${
        isActive 
          ? 'border-primary shadow-sm' 
          : 'hover:border-gray-300'
      }`}
    >
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-300"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={getProgressColor()}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - usagePercentage / 100)}`}
            className="transition-all duration-500"
          />
        </svg>
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Taxa de uso
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {credits !== null ? `${usagePercentage.toFixed(1)}% utilizado` : 'Carregando...'}
        </p>
      </div>
    </button>
  );
}