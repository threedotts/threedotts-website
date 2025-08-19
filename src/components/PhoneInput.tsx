import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Moçambique specific phone validation
const MOZAMBIQUE_CODE = "258";
const TOTAL_DIGITS = 12; // 258 + 9 digits

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  onError?: (error: string | null) => void;
}

export default function PhoneInput({ value, onChange, placeholder, className, error, onError }: PhoneInputProps) {
  const [internalError, setInternalError] = useState<string | null>(null);

  const validatePhone = (phone: string) => {
    if (!phone) {
      return null;
    }
    
    // Permitir apenas números
    if (!/^\d+$/.test(phone)) {
      return "O número deve conter apenas dígitos";
    }
    
    // Verificar se tem exatamente 12 dígitos
    if (phone.length !== TOTAL_DIGITS) {
      return `O número deve ter exatamente ${TOTAL_DIGITS} dígitos`;
    }
    
    // Verificar se começa com 258
    if (!phone.startsWith(MOZAMBIQUE_CODE)) {
      return `O número deve começar com ${MOZAMBIQUE_CODE}`;
    }
    
    return null;
  };

  const updateError = (errorMsg: string | null) => {
    setInternalError(errorMsg);
    onError?.(errorMsg);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir apenas números e teclas de controle
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Bloquear se não for número
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Bloquear se já tiver 12 dígitos
    const currentLength = value.length;
    if (currentLength >= TOTAL_DIGITS) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Garantir que só aceita números
    const cleaned = input.replace(/[^\d]/g, '');
    
    // Limitar ao máximo de 12 dígitos
    if (cleaned.length > TOTAL_DIGITS) return;
    
    onChange(cleaned);
    
    // Validar e atualizar erro
    const validationError = validatePhone(cleaned);
    updateError(validationError);
  };

  const handleClear = () => {
    onChange('');
    updateError(null);
  };

  const currentError = error || internalError;

  return (
    <div className="relative">
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder={placeholder || "258123456789"}
        maxLength={TOTAL_DIGITS}
        className={cn(
          currentError ? "border-destructive focus:border-destructive focus-visible:ring-0" : "",
          className
        )}
      />
      {currentError && (
        <p className="text-sm text-destructive mt-1">{currentError}</p>
      )}
    </div>
  );
}