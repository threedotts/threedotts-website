import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Building, Key, Save, Check, X, Settings as SettingsIcon } from "lucide-react";

interface Organization {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  members_count: number;
  agent_id: string[] | null;
  created_at: string;
  updated_at: string;
}

interface SettingsProps {
  selectedOrganization: Organization | null;
  onOrganizationUpdate?: (org: Organization) => void;
}

export default function Settings({ selectedOrganization, onOrganizationUpdate }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [orgData, setOrgData] = useState({
    name: "",
    description: "",
    domain: "",
  });
  const { toast } = useToast();
  
  usePageTitle("Configurações");

  useEffect(() => {
    if (selectedOrganization) {
      setOrgData({
        name: selectedOrganization.name || "",
        description: selectedOrganization.description || "",
        domain: selectedOrganization.domain || "",
      });
      setActivationCode(selectedOrganization.agent_id?.[0] || "");
      setIsActivated(!!selectedOrganization.agent_id?.length);
    }
  }, [selectedOrganization]);

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization || !activationCode.trim()) return;

    setLoading(true);
    try {
      // Update organizations table with agent_id
      const { error } = await supabase
        .from("organizations")
        .update({ agent_id: [activationCode.trim()] })
        .eq("id", selectedOrganization.id);

      if (error) throw error;

      // Create or update organization agent config
      const { data: existingConfig, error: configError } = await supabase
        .from("organization_agent_config")
        .select("id")
        .eq("organization_id", selectedOrganization.id)
        .maybeSingle();

      if (configError) {
        // Error handled silently
      }

      if (existingConfig) {
        // Update existing config
        const { error: updateError } = await supabase
          .from("organization_agent_config")
          .update({
            primary_agent_id: activationCode.trim(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq("id", existingConfig.id);

        if (updateError) throw updateError;
      } else {
        // Create new config
        const { error: insertError } = await supabase
          .from("organization_agent_config")
          .insert({
            organization_id: selectedOrganization.id,
            primary_agent_id: activationCode.trim(),
            status: 'active',
            api_key_secret_name: 'KEY_HERE'
          });

        if (insertError) throw insertError;
      }

      setIsActivated(true);
      toast({
        title: "Sucesso",
        description: "Código de ativação configurado com sucesso!",
      });

      // Update the organization in parent component
      if (onOrganizationUpdate) {
        onOrganizationUpdate({
          ...selectedOrganization,
          agent_id: [activationCode.trim()],
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao configurar código de ativação: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization) return;

    setLoading(true);
    try {

      const { data, error } = await supabase
        .from("organizations")
        .update({
          name: orgData.name.trim(),
          description: orgData.description.trim() || null,
          domain: orgData.domain.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOrganization.id)
        .select();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações da organização atualizadas!",
      });

      // Update the organization in parent component
      if (onOrganizationUpdate) {
        onOrganizationUpdate({
          ...selectedOrganization,
          name: orgData.name.trim(),
          description: orgData.description.trim() || null,
          domain: orgData.domain.trim() || null,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar organização: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOrganization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma organização selecionada
          </h3>
          <p className="text-muted-foreground">
            Selecione uma organização para acessar as configurações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">{/* Removido max-w-4xl mx-auto para usar largura total */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de {selectedOrganization.name}
        </p>
      </div>

      <Tabs defaultValue="activation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activation">Ativação</TabsTrigger>
          <TabsTrigger value="organization">Organização</TabsTrigger>
        </TabsList>

        {/* Activation Tab */}
        <TabsContent value="activation">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>Código de Ativação</CardTitle>
              </div>
              <CardDescription>
                Configure o código de ativação para habilitar todas as funcionalidades do call center.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isActivated && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Call Center Ativado
                    </span>
                  </div>
                  <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                    Seu call center está ativo e todas as funcionalidades estão disponíveis.
                  </p>
                </div>
              )}

              <form onSubmit={handleActivationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="activation-code">
                    Código de Ativação
                  </Label>
                  <Input
                    id="activation-code"
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="Digite o código recebido por email"
                    className="font-mono"
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Este código foi enviado por email quando você criou sua conta ou organização.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !activationCode.trim()}
                  className="w-full"
                >
                  {loading ? "Configurando..." : isActivated ? "Atualizar Código" : "Ativar Call Center"}
                </Button>
              </form>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Status da Ativação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Dashboard</span>
                    <Badge variant={isActivated ? "default" : "secondary"}>
                      {isActivated ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Call Center</span>
                    <Badge variant={isActivated ? "default" : "secondary"}>
                      {isActivated ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Informações da Organização</CardTitle>
              </div>
              <CardDescription>
                Atualize as informações básicas da sua organização.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrgDataSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nome da Organização</Label>
                  <Input
                    id="org-name"
                    type="text"
                    value={orgData.name}
                    onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da organização"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-description">Descrição</Label>
                  <Textarea
                    id="org-description"
                    value={orgData.description}
                    onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva brevemente sua organização"
                    rows={4}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-domain">Domínio da Empresa</Label>
                  <Input
                    id="org-domain"
                    type="text"
                    value={orgData.domain}
                    onChange={(e) => setOrgData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="exemplo: minhempresa.com"
                    disabled={loading}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Informações do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID da Organização:</span>
                      <span className="font-mono text-xs">{selectedOrganization.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Membros:</span>
                      <span>{selectedOrganization.members_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{new Date(selectedOrganization.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última atualização:</span>
                      <span>{new Date(selectedOrganization.updated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}