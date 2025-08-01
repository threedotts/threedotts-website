import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CreateOrganization = () => {
  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para criar uma organização",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate("/auth");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Show loading while checking authentication
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Generate activation code
  const generateActivationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase() + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da organização é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Generate activation code
      const code = generateActivationCode();
      setActivationCode(code);

      // Create new organization with agent_id as activation code array
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          user_id: user.id,
          name: organizationName.trim(),
          description: description.trim() || null,
          domain: domain.trim() || null,
          members_count: 1,
          agent_id: [code],
        });

      if (orgError) {
        toast({
          title: "Erro",
          description: "Erro ao criar organização: " + orgError.message,
          variant: "destructive",
        });
        return;
      }

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar organização",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with back button */}
      <div className="w-full bg-background/95 backdrop-blur-md border-b border-border px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Organização</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para criar uma nova organização. Você pode ter múltiplas organizações na sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    Nome da Organização *
                  </Label>
                  <Input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Digite o nome da organização"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descrição (Opcional)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva brevemente a organização"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">
                    Domínio da Empresa (Opcional)
                  </Label>
                  <Input
                    id="domain"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="exemplo: minhempresa.com"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !organizationName.trim()}
                  >
                    {loading ? "Criando..." : "Criar Organização"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Organização Criada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary mr-2" />
              </div>
              <p>
                Você receberá um email com o código de ativação e instruções completas 
                de como configurar seu call center.
              </p>
              <p className="text-sm text-muted-foreground">
                O código será necessário para ativar seu dashboard e call center.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={handleCloseDialog} className="w-full">
              Ir para o Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateOrganization;