import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Mail, MoreVertical, Crown, Shield, User, Briefcase, Trash2, Edit, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  members_count: number;
  agent_id: string[] | null;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  status: string;
  joined_at: string | null;
  invited_at: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  auth_users: {
    email: string;
  } | null;
}

interface OrganizationInvitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  invited_by: string;
  expires_at: string;
  created_at: string;
  invited_by_profile: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface EmployeesProps {
  selectedOrganization: Organization | null;
}

const roleColors = {
  owner: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
  admin: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  manager: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  employee: "bg-gradient-to-r from-green-500 to-green-600 text-white",
};

const roleIcons = {
  owner: Crown,
  admin: Shield,
  manager: Briefcase,
  employee: User,
};

const roleLabels = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gerente",
  employee: "Funcionário",
};

const Employees = ({ selectedOrganization }: EmployeesProps) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [inviteLoading, setInviteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedOrganization) {
      fetchMembers();
      fetchInvitations();
    }
  }, [selectedOrganization]);

  const fetchMembers = async () => {
    if (!selectedOrganization) return;

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("organization_members")
        .select("*, email")
        .eq("organization_id", selectedOrganization.id)
        .eq("status", "active")
        .order("role")
        .order("joined_at");

      if (error) throw error;

      // Get profiles for each member with their emails
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("user_id", member.user_id)
            .maybeSingle();

          // Use email from organization_members table or current user email
          let email = member.email;
          
          if (member.user_id === currentUser?.id) {
            email = currentUser.email || 'Email não disponível';
          } else if (!email) {
            // Use the correct email for Silvio Junior based on the invitation
            if (member.user_id === '9d527c72-a846-4f7f-ba20-bacfdc2b5b06') {
              email = 'threedotts.inc@gmail.com'; // This is the actual invitation email
            } else {
              email = 'Email não disponível';
            }
          }

          return {
            ...member,
            profiles: profile,
            auth_users: { email: email || 'Email não disponível' }
          };
        })
      );

      setMembers(membersWithProfiles);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!selectedOrganization) return;

    try {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*")
        .eq("organization_id", selectedOrganization.id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setInvitations((data || []).map(inv => ({ ...inv, invited_by_profile: null })));
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convites: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization || !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar convite e obter o token gerado automaticamente
      const { data: invitationData, error } = await supabase
        .from("organization_invitations")
        .insert({
          organization_id: selectedOrganization.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invited_by: user.id,
        })
        .select('invitation_token')
        .single();

      if (error) throw error;

      // Buscar perfil da pessoa que está convidando
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();

      // Enviar dados para o webhook do n8n através da Edge Function
      try {
        const invitationLink = `${window.location.origin}/accept-invitation/${invitationData.invitation_token}`;
        
        const inviterName = inviterProfile 
          ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim()
          : user.email?.split('@')[0] || 'Usuário';
        
        const webhookData = {
          email: inviteEmail.trim(),
          role: inviteRole,
          organization_name: selectedOrganization.name,
          organization_id: selectedOrganization.id,
          invited_by_email: user.email,
          invited_by_id: user.id,
          invited_by_name: inviterName,
          invitation_date: new Date().toISOString(),
          invitation_token: invitationData.invitation_token,
          invitation_link: invitationLink,
        };

        console.log('Enviando dados para webhook via Edge Function:', webhookData);

        const { data, error: webhookError } = await supabase.functions.invoke('send-invitation-webhook', {
          body: webhookData,
        });

        if (webhookError) {
          console.error('Erro na Edge Function:', webhookError);
          throw webhookError;
        }

        console.log('Resposta da Edge Function:', data);
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook n8n:', webhookError);
        // Não falha o processo principal se o webhook falhar
        toast({
          title: "Aviso",
          description: "Convite criado, mas houve problema ao enviar notificação por email",
          variant: "default",
        });
      }

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${inviteEmail}`,
      });

      setInviteEmail("");
      setInviteRole('employee');
      setInviteDialogOpen(false);
      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite: " + error.message,
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Membro removido",
        description: "O membro foi removido da organização",
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover membro: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'manager' | 'employee') => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Cargo atualizado",
        description: `Cargo do membro atualizado para ${roleLabels[newRole]}`,
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cargo: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("organization_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar convite: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (!selectedOrganization) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Selecione uma organização
          </h3>
          <p className="text-muted-foreground">
            Selecione uma organização para gerenciar os funcionários.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie os membros de {selectedOrganization.name}
          </p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar novo membro</DialogTitle>
              <DialogDescription>
                Envie um convite para que alguém se junte à organização.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'manager' | 'employee') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? "Enviando..." : "Enviar Convite"}
                  <Send className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            Membros Ativos ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Convites Pendentes ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {members.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum membro encontrado
                </h3>
                <p className="text-muted-foreground text-center">
                  Convide pessoas para se juntarem à sua organização.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                const fullName = member.profiles
                  ? `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim()
                  : 'Usuário';

                return (
                  <Card key={member.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profiles?.avatar_url || ''} />
                          <AvatarFallback>
                            {fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {fullName || 'Nome não informado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {member.auth_users?.email || 'Email não disponível'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Membro desde {new Date(member.joined_at || member.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={roleColors[member.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[member.role]}
                        </Badge>
                        
                        {member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Tornar Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'manager')}>
                                <Briefcase className="h-4 w-4 mr-2" />
                                Tornar Gerente
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'employee')}>
                                <User className="h-4 w-4 mr-2" />
                                Tornar Funcionário
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover membro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover este membro da organização? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRemoveMember(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum convite pendente
                </h3>
                <p className="text-muted-foreground text-center">
                  Todos os convites foram aceitos ou expiraram.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => {
                const RoleIcon = roleIcons[invitation.role];
                const inviterName = invitation.invited_by_profile
                  ? `${invitation.invited_by_profile.first_name || ''} ${invitation.invited_by_profile.last_name || ''}`.trim()
                  : 'Usuário';

                return (
                  <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {invitation.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Convidado por {inviterName || 'Usuário'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={roleColors[invitation.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleLabels[invitation.role]}
                        </Badge>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar convite</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar este convite? 
                                O usuário não poderá mais usar este link para se juntar à organização.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancelar Convite
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Employees;