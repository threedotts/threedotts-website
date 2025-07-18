import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, User, Mail, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeSlot {
  time: string;
  display: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const SchedulingForm = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { toast } = useToast();

  // Load available time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    setSelectedTime("");
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'getAvailability',
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeZone: 'America/Sao_Paulo',
        },
      });

      if (error) throw error;
      
      setAvailableSlots(data.availableSlots || []);
    } catch (error: any) {
      console.error('Error loading available slots:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!selectedDate) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data.",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedTime) {
      toast({
        title: "Horário obrigatório",
        description: "Por favor, selecione um horário.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'bookAppointment',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: format(selectedDate!, 'yyyy-MM-dd'),
          time: selectedTime,
          notes: formData.notes,
        },
      });

      if (error) throw error;

      // Send data to webhook if URL is provided
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            mode: 'no-cors',
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              date: format(selectedDate!, 'yyyy-MM-dd'),
              time: selectedTime,
              notes: formData.notes,
              appointmentData: data,
              timestamp: new Date().toISOString(),
              triggered_from: window.location.origin
            }),
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't fail the appointment if webhook fails
        }
      }

      toast({
        title: "Consulta agendada!",
        description: "Sua consulta foi agendada com sucesso. Você receberá um email de confirmação em breve.",
      });

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setFormData({ name: "", email: "", phone: "", notes: "" });
      setAvailableSlots([]);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Erro no agendamento",
        description: error.message || "Não foi possível agendar sua consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira a URL do webhook primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const testData = {
        name: "Test User",
        email: "test@example.com", 
        phone: "+258123456789",
        date: "2025-07-25",
        time: "10:00",
        notes: "Test webhook call",
        test: true,
        timestamp: new Date().toISOString(),
        triggered_from: window.location.origin
      };

      console.log('Sending webhook request to:', webhookUrl);
      console.log('Data being sent:', testData);

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        mode: 'no-cors',
        body: JSON.stringify(testData),
      });

      toast({
        title: "Webhook enviado!",
        description: "Requisição foi enviada. Verifique se foi recebida no seu sistema.",
      });
    } catch (error) {
      console.error('Webhook test error details:', error);
      toast({
        title: "Erro no teste",
        description: `Erro: ${error instanceof Error ? error.message : 'Não foi possível conectar ao webhook'}`,
        variant: "destructive",
      });
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Agende sua Consulta Gratuita
        </h1>
        <p className="text-muted-foreground">
          Escolha a data e horário que melhor se adequam à sua agenda
        </p>
        <Button 
          onClick={testWebhook}
          variant="outline"
          size="sm"
        >
          Testar Webhook
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar and Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Selecione a Data e Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  date < tomorrow || 
                  date > twoMonthsFromNow ||
                  date.getDay() === 0 // Only Sunday is disabled
                }
                className="rounded-md border"
                locale={ptBR}
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label className="text-sm font-medium">
                    Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Label>
                </div>

                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot.time)}
                        className="justify-center"
                      >
                        {slot.display}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary">
                      Nenhum horário disponível para esta data
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Suas Informações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome completo *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Conte-nos um pouco sobre seu projeto ou necessidades..."
                  rows={3}
                />
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">
                  URL do Webhook (opcional)
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-xs text-muted-foreground">
                  Use Zapier, webhook.site ou ngrok para criar um webhook público
                </p>
              </div>

              {/* Summary */}
              {selectedDate && selectedTime && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium">Resumo do agendamento:</h4>
                  <p className="text-sm text-muted-foreground">
                    📅 {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ⏰ {availableSlots.find(s => s.time === selectedTime)?.display}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !selectedDate || !selectedTime}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Agendando...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchedulingForm;