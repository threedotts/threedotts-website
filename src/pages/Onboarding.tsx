import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Building2, Globe, Target, Phone, Wrench, Zap, Users, MessageSquare } from "lucide-react";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    organizationWebsite: "",
    industrySector: "",
    mainObjective: "",
    monthlyCallVolume: "",
    currentTools: [] as string[],
    integrationChannels: [] as string[],
    howFoundPlatform: "",
    currentChallenges: ""
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const industrySectors = [
    "Tecnologia", "Saúde", "Educação", "Finanças", "E-commerce", "Imobiliário", 
    "Turismo", "Manufatura", "Serviços", "Consultoria", "Outro"
  ];

  const objectives = [
    "Suporte técnico", "Vendas", "Agendamentos", "Atendimento ao cliente", 
    "Cobranças", "Pesquisas de satisfação", "Lead qualification", "Outro"
  ];

  const callVolumes = [
    "Até 100 chamadas/mês", "100-500 chamadas/mês", "500-1000 chamadas/mês", 
    "1000-5000 chamadas/mês", "Mais de 5000 chamadas/mês"
  ];

  const tools = [
    "CRM (Salesforce, HubSpot, etc.)", "WhatsApp Business", "Email Marketing", 
    "Chat em website", "Redes sociais", "Sistema de tickets", "ERP", 
    "Planilhas (Excel/Google Sheets)", "Outro"
  ];

  const channels = [
    "Telefone", "WhatsApp", "Email", "Chat website", "Instagram", "Facebook", 
    "LinkedIn", "SMS", "Telegram", "Outro"
  ];

  const howFoundOptions = [
    "Google/Pesquisa", "Redes sociais", "Indicação", "Publicidade online", 
    "Evento/Conferência", "Blog/Artigo", "YouTube", "Outro"
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: 'currentTools' | 'integrationChannels', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from('onboarding')
        .insert({
          user_id: user.id,
          organization_website: formData.organizationWebsite || null,
          industry_sector: formData.industrySector,
          main_objective: formData.mainObjective,
          monthly_call_volume: formData.monthlyCallVolume,
          current_tools: formData.currentTools,
          integration_channels: formData.integrationChannels,
          how_found_platform: formData.howFoundPlatform,
          current_challenges: formData.currentChallenges,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Onboarding concluído!",
        description: "Suas informações foram salvas com sucesso.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar informações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.industrySector && formData.mainObjective;
      case 2:
        return formData.monthlyCallVolume;
      case 3:
        return formData.currentTools.length > 0 && formData.integrationChannels.length > 0;
      case 4:
        return formData.howFoundPlatform;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Configuração Inicial</CardTitle>
            <CardDescription className="text-muted-foreground">
              Vamos personalizar sua experiência no Threedotts
            </CardDescription>
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Passo {currentStep} de {totalSteps}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Sobre sua organização</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website da organização (opcional)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        className="pl-10"
                        placeholder="https://suaempresa.com"
                        value={formData.organizationWebsite}
                        onChange={(e) => handleInputChange('organizationWebsite', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Setor de atuação</Label>
                    <Select value={formData.industrySector} onValueChange={(value) => handleInputChange('industrySector', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {industrySectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Principal objetivo com o call center</Label>
                    <Select value={formData.mainObjective} onValueChange={(value) => handleInputChange('mainObjective', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o objetivo principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((objective) => (
                          <SelectItem key={objective} value={objective}>{objective}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Phone className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Volume de chamadas</h3>
                </div>
                
                <div className="space-y-2">
                  <Label>Volume médio de chamadas mensais esperadas</Label>
                  <Select value={formData.monthlyCallVolume} onValueChange={(value) => handleInputChange('monthlyCallVolume', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o volume esperado" />
                    </SelectTrigger>
                    <SelectContent>
                      {callVolumes.map((volume) => (
                        <SelectItem key={volume} value={volume}>{volume}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Ferramentas e integração</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Ferramentas que já utilizam (selecione todas que se aplicam)</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {tools.map((tool) => (
                        <div key={tool} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tool-${tool}`}
                            checked={formData.currentTools.includes(tool)}
                            onCheckedChange={(checked) => handleCheckboxChange('currentTools', tool, !!checked)}
                          />
                          <Label htmlFor={`tool-${tool}`} className="text-sm">{tool}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Canais que pretendem integrar (selecione todos que se aplicam)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {channels.map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={formData.integrationChannels.includes(channel)}
                            onCheckedChange={(checked) => handleCheckboxChange('integrationChannels', channel, !!checked)}
                          />
                          <Label htmlFor={`channel-${channel}`} className="text-sm">{channel}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">Últimas informações</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Como conheceu a Threedotts?</Label>
                    <Select value={formData.howFoundPlatform} onValueChange={(value) => handleInputChange('howFoundPlatform', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione como nos conheceu" />
                      </SelectTrigger>
                      <SelectContent>
                        {howFoundOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challenges">Quais os maiores desafios atuais no atendimento ao cliente? (opcional)</Label>
                    <Textarea
                      id="challenges"
                      placeholder="Descreva os principais problemas que enfrenta no atendimento..."
                      value={formData.currentChallenges}
                      onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                className="flex items-center"
              >
                {currentStep === totalSteps ? (
                  isLoading ? "Finalizando..." : "Finalizar"
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;