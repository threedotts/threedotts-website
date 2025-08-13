import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  PieChart, 
  User, 
  Building, 
  Calendar,
  CheckSquare,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  MessageSquare,
  UserCheck,
  ShoppingCart,
  Settings,
  Star,
  ChevronDown,
  ChevronRight,
  PhoneCall
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: PieChart,
  },
  { 
    title: "Agendamento", 
    url: "/dashboard/schedule", 
    icon: Calendar,
  },
  { 
    title: "Funcionários", 
    url: "/dashboard/employees", 
    icon: Users,
  },
  { 
    title: "Análises", 
    url: "/dashboard/analytics", 
    icon: TrendingUp,
  },
  { 
    title: "Relatórios", 
    url: "/dashboard/reports", 
    icon: FileText,
  },
  { 
    title: "Clientes", 
    url: "/dashboard/customers", 
    icon: UserCheck,
  },
  { 
    title: "Mensagens", 
    url: "/dashboard/messages", 
    icon: MessageSquare,
  },
  { 
    title: "Histórico", 
    url: "/dashboard/call-history", 
    icon: PhoneCall,
  },
  { 
    title: "Leads", 
    url: "/dashboard/leads", 
    icon: UserCheck,
  },
  { 
    title: "Faturamento", 
    url: "/dashboard/billing", 
    icon: DollarSign,
    adminOnly: true,
  },
  { 
    title: "Configurações", 
    url: "/dashboard/settings", 
    icon: Settings,
  },
];

interface AppSidebarProps {
  user: any;
  profile: any;
}

export function AppSidebar({ user, profile }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      try {
        // Check if user is organization owner
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from('organizations')
          .select('id')
          .eq('user_id', user.id);

        if (ownedOrgs && ownedOrgs.length > 0) {
          setUserRole('owner');
          return;
        }

        // Check if user is member with admin/owner role
        const { data: memberRole, error: memberError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .in('role', ['owner', 'admin'])
          .maybeSingle();

        if (memberError) {
          console.error('Error fetching user role:', memberError);
          return;
        }

        setUserRole(memberRole?.role || null);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUserRole();
  }, [user]);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };
  
  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => 
      prev.includes(itemTitle) 
        ? prev.filter(title => title !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/15 text-primary font-medium" 
      : "text-sidebar-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-200";

  const getSubmenuCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium" 
      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors duration-200";

  return (
    <Sidebar className="border-r border-border/50 w-64">
      <SidebarContent className="flex flex-col h-full">
        {/* Organization Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 min-w-0 flex items-center">
              <h2 className="text-base font-semibold text-foreground truncate">
                Threedotts
              </h2>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 p-4">
          <SidebarMenu className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              
              // Hide admin-only items if user is not admin or owner
              if (item.adminOnly && !['owner', 'admin'].includes(userRole || '')) {
                return null;
              }
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`${getNavCls(isActive(item.url))} h-10 px-3`}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full flex items-center space-x-3 text-left"
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        {/* User Profile at Bottom */}
        {user && (
          <div className="p-4 border-t border-border/50">
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/60 transition-colors duration-200"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={profile?.avatar_url} 
                  alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`} 
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.first_name?.[0] || profile?.last_name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Usuário'
                  }
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}