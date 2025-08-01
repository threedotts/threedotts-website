import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  validatePassword, 
  validateName, 
  validateEmail, 
  sanitizeInput 
} from "@/utils/securityValidation";
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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      console.log('Fetching organization data for ID:', data.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("name, description")
        .eq("id", data.organization_id)
        .single();

      console.log('Organization query result:', { orgData, orgError });

      if (orgError) {
        console.error("Error fetching organization:", orgError);
      }

      const invitationWithOrg = {
        ...data,
        organizations: orgData || { name: "Unknown Organization", description: null }
      };

      console.log('Final invitation data:', invitationWithOrg);

      setInvitation(invitationWithOrg);
      setFormData(prev => ({ ...prev, email: data.email }));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear previous errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation using security utils
    const newErrors: Record<string, string> = {};
    
    const firstNameError = validateName(formData.firstName, "Primeiro nome");
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateName(formData.lastName, "Último nome");
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAccepting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/accept-invitation/${token}`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
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
    
    // Enhanced validation
    const newErrors: Record<string, string> = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    if (!formData.password.trim()) {
      newErrors.password = "Senha é obrigatória";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAccepting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
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
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Primeiro Nome</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        placeholder="Seu primeiro nome"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                      {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apelido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        placeholder="Seu apelido"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                      {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-muted"
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isSignUp ? "Mín. 8 caracteres, maiúscula, minúscula, número e símbolo" : "Digite sua senha"}
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
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