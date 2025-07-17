import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
  { code: "+86", flag: "🇨🇳", pattern: /^\+86(\d{11})$/, format: "+86 $1", placeholder: "+86 138 0013 8000" },
  { code: "+91", flag: "🇮🇳", pattern: /^\+91(\d{10})$/, format: "+91 $1", placeholder: "+91 98765 43210" },
  { code: "+81", flag: "🇯🇵", pattern: /^\+81(\d{10})$/, format: "+81 $1", placeholder: "+81 90 1234 5678" },
  { code: "+82", flag: "🇰🇷", pattern: /^\+82(\d{9,10})$/, format: "+82 $1", placeholder: "+82 10 1234 5678" },
  { code: "+7", flag: "🇷🇺", pattern: /^\+7(\d{10})$/, format: "+7 $1", placeholder: "+7 921 123 45 67" },
  { code: "+61", flag: "🇦🇺", pattern: /^\+61(\d{9})$/, format: "+61 $1", placeholder: "+61 412 345 678" },
  { code: "+64", flag: "🇳🇿", pattern: /^\+64(\d{8,9})$/, format: "+64 $1", placeholder: "+64 21 123 4567" },
  { code: "+27", flag: "🇿🇦", pattern: /^\+27(\d{9})$/, format: "+27 $1", placeholder: "+27 82 123 4567" },
  { code: "+52", flag: "🇲🇽", pattern: /^\+52(\d{10})$/, format: "+52 $1", placeholder: "+52 55 1234 5678" },
  { code: "+54", flag: "🇦🇷", pattern: /^\+54(\d{10})$/, format: "+54 $1", placeholder: "+54 11 1234 5678" },
  { code: "+56", flag: "🇨🇱", pattern: /^\+56(\d{8,9})$/, format: "+56 $1", placeholder: "+56 9 8765 4321" },
  { code: "+57", flag: "🇨🇴", pattern: /^\+57(\d{10})$/, format: "+57 $1", placeholder: "+57 321 123 4567" },
  { code: "+51", flag: "🇵🇪", pattern: /^\+51(\d{9})$/, format: "+51 $1", placeholder: "+51 987 654 321" },
  { code: "+58", flag: "🇻🇪", pattern: /^\+58(\d{10})$/, format: "+58 $1", placeholder: "+58 412 123 4567" },
  { code: "+503", flag: "🇸🇻", pattern: /^\+503(\d{8})$/, format: "+503 $1", placeholder: "+503 7012 3456" },
  { code: "+506", flag: "🇨🇷", pattern: /^\+506(\d{8})$/, format: "+506 $1", placeholder: "+506 8712 3456" },
  { code: "+507", flag: "🇵🇦", pattern: /^\+507(\d{8})$/, format: "+507 $1", placeholder: "+507 6123 4567" },
  { code: "+504", flag: "🇭🇳", pattern: /^\+504(\d{8})$/, format: "+504 $1", placeholder: "+504 9123 4567" },
  { code: "+502", flag: "🇬🇹", pattern: /^\+502(\d{8})$/, format: "+502 $1", placeholder: "+502 5123 4567" },
  { code: "+501", flag: "🇧🇿", pattern: /^\+501(\d{7})$/, format: "+501 $1", placeholder: "+501 612 3456" },
  { code: "+505", flag: "🇳🇮", pattern: /^\+505(\d{8})$/, format: "+505 $1", placeholder: "+505 8123 4567" },
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
      
      case "+49": // Alemanha (10-11 dígitos)
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        if (numberPart.length <= 8) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 8)} ${numberPart.slice(8, 11)}`;
      
      case "+44": // Reino Unido
        if (numberPart.length <= 2) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2)}`;
        if (numberPart.length <= 10) return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2, 6)} ${numberPart.slice(6, 10)}`;
        return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2, 6)} ${numberPart.slice(6, 10)}`;
      
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
      
      case "+39": // Itália (9-10 dígitos)
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        if (numberPart.length <= 10) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 10)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 10)}`;
      
      case "+86": // China
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 7) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 7)} ${numberPart.slice(7, 11)}`;
      
      case "+91": // Índia
        if (numberPart.length <= 5) return `${country.code} ${numberPart}`;
        return `${country.code} ${numberPart.slice(0, 5)} ${numberPart.slice(5, 10)}`;
      
      case "+81": // Japão
        if (numberPart.length <= 2) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2)}`;
        return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2, 6)} ${numberPart.slice(6, 10)}`;
      
      case "+82": // Coreia do Sul
        if (numberPart.length <= 2) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2)}`;
        return `${country.code} ${numberPart.slice(0, 2)} ${numberPart.slice(2, 6)} ${numberPart.slice(6, 10)}`;
      
      case "+7": // Rússia
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        if (numberPart.length <= 8) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 8)} ${numberPart.slice(8, 10)}`;
      
      default:
        // Para outros países com formatação mais simples
        if (numberPart.length <= 3) return `${country.code} ${numberPart}`;
        if (numberPart.length <= 6) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
        if (numberPart.length <= 9) return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
        return `${country.code} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 9)}`;
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
      
      // Verificar se há um país detectado e validar o comprimento
      if (cleaned.startsWith('+')) {
        const country = countryCodes.find(c => cleaned.startsWith(c.code));
        
        if (country) {
          const numberPart = cleaned.substring(country.code.length);
          
          // Extrair o número máximo de dígitos permitidos do pattern
          const patternMatch = country.pattern.toString().match(/\\d\{(\d+),?(\d+)?\}/);
          let maxDigits;
          
          if (patternMatch) {
            if (patternMatch[2]) {
              // Range como {10,11}
              maxDigits = parseInt(patternMatch[2]);
            } else {
              // Número fixo como {9}
              maxDigits = parseInt(patternMatch[1]);
            }
          } else {
            // Fallback para alguns casos especiais
            switch (country.code) {
              case "+55": maxDigits = 11; break; // Brasil
              case "+49": maxDigits = 11; break; // Alemanha
              case "+39": maxDigits = 10; break; // Itália
              case "+82": maxDigits = 10; break; // Coreia do Sul
              case "+32": maxDigits = 9; break;  // Bélgica
              case "+56": maxDigits = 9; break;  // Chile
              case "+64": maxDigits = 9; break;  // Nova Zelândia
              default: maxDigits = 10;
            }
          }
          
          // Bloquear se exceder o limite de dígitos
          if (numberPart.length > maxDigits) {
            return;
          }
        }
      }
      
      // Limitar o tamanho máximo geral
      if (cleaned.length > 20) return;
      
      onChange(cleaned);
    }
  };

  const handleClear = () => {
    onChange('');
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
          value ? "pr-10" : "pr-3",
          className
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}