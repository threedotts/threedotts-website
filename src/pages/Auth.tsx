import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, Mail, Lock, Eye, EyeOff, User, Shield, CheckCircle } from "lucide-react";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { 
  sanitizeInput, 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateOrganization 
} from "@/utils/securityValidation";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Security monitoring
  const security = useSecurityMonitor(formData.email || 'anonymous');
  useSessionTimeout();
  usePageTitle("Login");

  // Remove old validation functions as they're now imported from utils

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check security lockout
    if (security.isLocked) {
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas falhadas. Tente novamente em ${security.formatTimeRemaining()}`,
        variant: "destructive",
      });
      return;
    }
    
    // Enhanced validation using security utils
    const newErrors: Record<string, string> = {};
    
    const firstNameError = validateName(formData.firstName, "Primeiro nome");
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateName(formData.lastName, "Último nome");
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const orgError = validateOrganization(formData.organizationName);
    if (orgError) newErrors.organizationName = orgError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            organization_name: formData.organizationName,
            organization_members_count: "1",
          }
        }
      });

      if (error) throw error;

      security.recordSuccessfulAttempt();
      
      // Show success dialog instead of toast
      setShowSuccessDialog(true);
    } catch (error: any) {
      security.recordFailedAttempt();
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    // Reset form
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      organizationName: "",
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check security lockout
    if (security.isLocked) {
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas falhadas. Tente novamente em ${security.formatTimeRemaining()}`,
        variant: "destructive",
      });
      return;
    }
    
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

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      security.recordSuccessfulAttempt();
      navigate("/");
    } catch (error: any) {
      security.recordFailedAttempt();
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro no login com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignUp = async () => {
    // Validate organization name is provided
    if (!formData.organizationName.trim()) {
      toast({
        title: "Nome da organização obrigatório",
        description: "Por favor, preencha o nome da sua organização antes de continuar com Google.",
        variant: "destructive",
      });
      return;
    }

    const orgError = validateOrganization(formData.organizationName);
    if (orgError) {
      setErrors(prev => ({ ...prev, organizationName: orgError }));
      toast({
        title: "Nome da organização inválido",
        description: orgError,
        variant: "destructive",
      });
      return;
    }

    try {
      // Store organization name in localStorage before OAuth
      localStorage.setItem('pending_organization_name', formData.organizationName);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro no cadastro com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Link>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Threedotts Platform</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesso exclusivo para clientes de <strong>Call Center</strong>
            </CardDescription>
            
            {/* Security Status Indicator */}
            {security.isLocked && (
              <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm">
                  Conta bloqueada por segurança. Tempo restante: {security.formatTimeRemaining()}
                </span>
              </div>
            )}
            
            {security.failedAttempts > 0 && !security.isLocked && (
              <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm">
                  {security.failedAttempts}/{security.maxAttempts} tentativas falhadas
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        className="pl-10"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="pl-10 pr-10"
                        placeholder="Sua senha"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || security.isLocked}
                  >
                    {isLoading ? "Entrando..." : security.isLocked ? `Bloqueado (${security.formatTimeRemaining()})` : "Entrar"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground text-center">
                    <strong>Atenção:</strong> Esta área é exclusiva para clientes dos serviços de 
                    <strong> Call Center</strong> que precisam acessar 
                    o dashboard para gerenciar seus serviços.
                  </p>
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nome da Organização</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="org-name"
                        name="organizationName"
                        type="text"
                        required
                        className="pl-10"
                        placeholder="Nome da sua empresa"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.organizationName && <p className="text-sm text-destructive mt-1">{errors.organizationName}</p>}
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Primeiro Nome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="first-name"
                          name="firstName"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="Seu primeiro nome"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Apelido</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="last-name"
                          name="lastName"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="Seu apelido"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                      {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        className="pl-10"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="pl-10 pr-10"
                        placeholder="Mínimo 8 caracteres com maiúscula, minúscula e número"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || security.isLocked}
                  >
                    {isLoading ? "Criando conta..." : security.isLocked ? `Bloqueado (${security.formatTimeRemaining()})` : "Criar Conta"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Conta Criada com Sucesso!</DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary mr-2" />
              </div>
              <p>
                Você receberá <strong>dois emails importantes</strong>:
              </p>
              <div className="text-left space-y-2">
                <p className="text-sm">
                  <strong>1. Email de confirmação do Supabase:</strong> Confirme seu email para ativar a conta.
                </p>
                <p className="text-sm">
                  <strong>2. Código de ativação:</strong> Necessário para configurar seu call center e dashboard.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e spam. Ambos os emails são necessários para usar a plataforma.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={handleCloseDialog} className="w-full">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;