import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CountryCode {
  code: string;
  flag: string;
  pattern: RegExp;
  format: string;
  placeholder: string;
}

const countryCodes: CountryCode[] = [
  { code: "+351", flag: "🇵🇹", pattern: /^\+351(\d{9})$/, format: "+351 $1 $2 $3", placeholder: "+351 123 456 789" },
  { code: "+34", flag: "🇪🇸", pattern: /^\+34(\d{9})$/, format: "+34 $1 $2 $3", placeholder: "+34 123 456 789" },
  { code: "+33", flag: "🇫🇷", pattern: /^\+33(\d{9})$/, format: "+33 $1 $2 $3 $4", placeholder: "+33 1 23 45 67 89" },
  { code: "+49", flag: "🇩🇪", pattern: /^\+49(\d{10,11})$/, format: "+49 $1 $2", placeholder: "+49 123 456789" },
  { code: "+44", flag: "🇬🇧", pattern: /^\+44(\d{10})$/, format: "+44 $1 $2 $3", placeholder: "+44 123 456 7890" },
  { code: "+1", flag: "🇺🇸", pattern: /^\+1(\d{10})$/, format: "+1 $1 $2-$3", placeholder: "+1 123 456-7890" },
  { code: "+55", flag: "🇧🇷", pattern: /^\+55(\d{2})(\d{8,9})$/, format: "+55 $1 $2", placeholder: "+55 11 12345-6789" },
  { code: "+39", flag: "🇮🇹", pattern: /^\+39(\d{9,10})$/, format: "+39 $1", placeholder: "+39 123 456 7890" },
  { code: "+31", flag: "🇳🇱", pattern: /^\+31(\d{9})$/, format: "+31 $1", placeholder: "+31 123 456 789" },
  { code: "+41", flag: "🇨🇭", pattern: /^\+41(\d{9})$/, format: "+41 $1", placeholder: "+41 123 456 789" },
  { code: "+43", flag: "🇦🇹", pattern: /^\+43(\d{10})$/, format: "+43 $1", placeholder: "+43 123 456 7890" },
  { code: "+32", flag: "🇧🇪", pattern: /^\+32(\d{8,9})$/, format: "+32 $1", placeholder: "+32 123 45 67 89" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ value, onChange, placeholder, className }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [detectedCountry, setDetectedCountry] = useState<CountryCode | null>(null);

  const formatPhoneNumber = (input: string) => {
    // Remove tudo exceto números e o sinal +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Se não começar com +, adiciona
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  const getFormattedDisplay = (cleanValue: string) => {
    if (!cleanValue.startsWith('+')) return cleanValue;

    // Encontrar o país baseado no código
    const country = countryCodes.find(c => cleanValue.startsWith(c.code));
    
    if (!country) {
      setDetectedCountry(null);
      return cleanValue;
    }

    setDetectedCountry(country);
    
    // Aplicar formatação específica do país
    const numberPart = cleanValue.substring(country.code.length);
    
    // Formatações específicas por país
    switch (country.code) {
      case "+351": // Portugal
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 9)}`;
      
      case "+34": // Espanha
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 9)}`;
      
      case "+33": // França
        if (numberPart.length <= 1) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 3) return `${country.code} ${numberPart.slice(0, 1)} ${numberPart.slice(1)}`;
        if (numberPart.length <= 5) return `${country.code} ${numberPart.slice(0, 1)} ${numberPart.slice(1, 3)} ${numberPart.slice(3)}`;
        if (numberPart.length <= 7) return `${country.code} ${numberPart.slice(0, 1)} ${numberPart.slice(1, 3)} ${numberPart.slice(3, 5)} ${numberPart.slice(5)}`;
        return `${country.code} ${numberPart.slice(0, 1)} ${numberPart.slice(1, 3)} ${numberPart.slice(3, 5)} ${numberPart.slice(5, 7)} ${numberPart.slice(7, 9)}`;
      
      case "+1": // EUA/Canadá
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)}-${numberPart.slice(6, 10)}`;
      
      case "+55": // Brasil
        if (numberPart.length <= 2) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 7) return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2)}`;
        if (numberPart.length <= 11) {
          const areaCode = numberPart.slice(0, 2);
          const number = numberPart.slice(2);
          if (number.length <= 4) return `${country.code} ${areaCode} ${number}`;
          if (number.length === 8) return `${country.code} ${areaCode} ${number.slice(0, 4)}-${number.slice(4)}`;
          return `${country.code} ${areaCode} ${number.slice(0, 5)}-${number.slice(5)}`;
        }
        return cleanValue;
      
      default:
        // Formatação genérica
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
    }
  };

  useEffect(() => {
    if (value) {
      const formatted = getFormattedDisplay(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
      setDetectedCountry(null);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const prevLength = displayValue.length;
    
    // Se o usuário está deletando (input é menor que display anterior)
    const isDeleting = input.length < prevLength;
    
    if (isDeleting) {
      // Extrair apenas os dígitos e o +
      let cleaned = input.replace(/[^\d+]/g, '');
      
      // Se deletou tudo ou só restou +, limpar completamente
      if (cleaned === '' || cleaned === '+') {
        onChange('');
        return;
      }
      
      // Garantir que comece com +
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
      }
      
      // Ao deletar, não aplicar formatação imediatamente para permitir edição livre
      onChange(cleaned);
    } else {
      // Quando adicionando caracteres, aplicar formatação normal
      const cleaned = formatPhoneNumber(input);
      
      // Limitar o tamanho máximo
      if (cleaned.length > 20) return;
      
      onChange(cleaned);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
        {detectedCountry && (
          <span className="text-lg" title={detectedCountry.code}>
            {detectedCountry.flag}
          </span>
        )}
      </div>
      <Input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={detectedCountry?.placeholder || placeholder || "+351 123 456 789"}
        className={cn(
          detectedCountry ? "pl-12" : "pl-3",
          className
        )}
      />
    </div>
  );
}