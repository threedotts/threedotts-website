import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, Loader2 } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organization_id: string;
  invited_by: string;
  organizations: {
    name: string;
    description: string;
  };
}

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    checkInvitation();
    checkUser();
  }, [token]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkInvitation = async () => {
    if (!token) {
      toast({
        title: "Token inválido",
        description: "O link do convite é inválido.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    try {
      console.log('Checking invitation for token:', token);
      const currentTime = new Date().toISOString();
      console.log('Current time for comparison:', currentTime);
      
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*")
        .eq("invitation_token", token)
        .is("accepted_at", null)
        .gt("expires_at", currentTime)
        .maybeSingle();

      console.log('Query result:', { data, error });

      if (error) {
        console.error("Database error:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar o convite: " + error.message,
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!data) {
        // Try to fetch the invitation without date filter to see what's wrong
        const { data: debugData } = await supabase
          .from("organization_invitations")
          .select("*, expires_at, accepted_at")
          .eq("invitation_token", token)
          .maybeSingle();
        
        console.log('Debug - invitation found:', debugData);
        
        if (debugData) {
          if (debugData.accepted_at) {
            toast({
              title: "Convite já aceito",
              description: "Este convite já foi aceito anteriormente.",
              variant: "destructive",
            });
          } else if (new Date(debugData.expires_at) < new Date()) {
            toast({
              title: "Convite expirado",
              description: "Este convite já expirou.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Convite inválido",
              description: "O convite não foi encontrado.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Convite não encontrado",
            description: "O token do convite não existe.",
            variant: "destructive",
          });
        }
        navigate("/");
        return;
      }

      // Fetch organization details separately
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("name, description")
        .eq("id", data.organization_id)
        .single();

      if (orgError) {
        console.error("Error fetching organization:", orgError);
      }

      const invitationWithOrg = {
        ...data,
        organizations: orgData || { name: "Unknown Organization", description: null }
      };

      setInvitation(invitationWithOrg);
      setEmail(data.email);
    } catch (error) {
      console.error("Erro ao verificar convite:", error);
      toast({
        title: "Erro",
        description: "Erro ao verificar o convite.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/accept-invitation/${token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar a conta e depois aceite o convite.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Após login, recarregar para aceitar o convite
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    if (user.email !== invitation.email) {
      toast({
        title: "Email incorreto",
        description: "Você deve estar logado com o email que recebeu o convite.",
        variant: "destructive",
      });
      return;
    }

    setAccepting(true);
    try {
      // Marcar convite como aceito
      const { error: updateError } = await supabase
        .from("organization_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // Criar membro na organização
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role as 'admin' | 'manager' | 'employee',
          status: "active",
          joined_at: new Date().toISOString(),
          invited_by: invitation.invited_by,
        });

      if (memberError) throw memberError;

      toast({
        title: "Convite aceito!",
        description: `Você agora é membro de ${invitation.organizations.name}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao aceitar convite: " + error.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-medium">Convite não encontrado</h3>
            <p className="text-muted-foreground mt-2">
              O link do convite é inválido ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Convite para Organização</CardTitle>
            <CardDescription>
              Você foi convidado para se juntar a{" "}
              <span className="font-medium">{invitation.organizations.name}</span>
            </CardDescription>
          </div>
          <Badge variant="secondary" className="mx-auto">
            Cargo: {invitation.role}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user ? (
            // Usuário logado - pode aceitar convite
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Logado como: <span className="font-medium">{user.email}</span>
                </p>
              </div>
              
              {user.email === invitation.email ? (
                <Button 
                  onClick={handleAcceptInvitation} 
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aceitando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Aceitar Convite
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm text-destructive">
                    Você deve estar logado com o email {invitation.email}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full"
                  >
                    Fazer logout
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Usuário não logado - mostrar formulário de login/cadastro
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? "Crie sua conta para aceitar o convite" : "Entre na sua conta para aceitar o convite"}
                </p>
              </div>
              
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? "Crie uma senha (min. 6 caracteres)" : "Digite sua senha"}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={accepting} className="w-full">
                  {accepting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {isSignUp ? "Criar Conta" : "Entrar"}
                </Button>
              </form>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;