import { useState } from "react";
import { 
  BarChart3, 
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
  ChevronRight
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

const menuItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: BarChart3,
  },
  { 
    title: "Events", 
    url: "/dashboard/events", 
    icon: Star,
  },
  { 
    title: "Schedule", 
    url: "/dashboard/schedule", 
    icon: Calendar,
    hasSubmenu: true,
    submenu: [
      { title: "Calendar View", url: "/dashboard/schedule/calendar" },
      { title: "List View", url: "/dashboard/schedule/list" },
    ]
  },
  { 
    title: "Tasks", 
    url: "/dashboard/tasks", 
    icon: CheckSquare,
    hasSubmenu: true,
    submenu: [
      { title: "Active Tasks", url: "/dashboard/tasks/active" },
      { title: "Completed", url: "/dashboard/tasks/completed" },
    ]
  },
  { 
    title: "Employees", 
    url: "/dashboard/employees", 
    icon: Users,
  },
  { 
    title: "Analytics", 
    url: "/dashboard/analytics", 
    icon: TrendingUp,
    hasSubmenu: true,
    submenu: [
      { title: "Reports", url: "/dashboard/analytics/reports" },
      { title: "Performance", url: "/dashboard/analytics/performance" },
    ]
  },
  { 
    title: "Reports", 
    url: "/dashboard/reports", 
    icon: FileText,
    hasSubmenu: true,
    submenu: [
      { title: "Monthly", url: "/dashboard/reports/monthly" },
      { title: "Quarterly", url: "/dashboard/reports/quarterly" },
    ]
  },
  { 
    title: "Finances", 
    url: "/dashboard/finances", 
    icon: DollarSign,
    hasSubmenu: true,
    submenu: [
      { title: "Income", url: "/dashboard/finances/income" },
      { title: "Expenses", url: "/dashboard/finances/expenses" },
    ]
  },
  { 
    title: "Customers", 
    url: "/dashboard/customers", 
    icon: UserCheck,
  },
  { 
    title: "Messages", 
    url: "/dashboard/messages", 
    icon: MessageSquare,
  },
  { 
    title: "Leads", 
    url: "/dashboard/leads", 
    icon: UserCheck,
  },
  { 
    title: "Sales", 
    url: "/dashboard/sales", 
    icon: ShoppingCart,
    hasSubmenu: true,
    submenu: [
      { title: "Active Deals", url: "/dashboard/sales/deals" },
      { title: "Pipeline", url: "/dashboard/sales/pipeline" },
    ]
  },
  { 
    title: "Settings", 
    url: "/dashboard/settings", 
    icon: Settings,
    hasSubmenu: true,
    submenu: [
      { title: "General", url: "/dashboard/settings/general" },
      { title: "Security", url: "/dashboard/settings/security" },
    ]
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

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  
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
                {profile?.organization_name || 'Organization'}
              </h2>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 p-4">
          <SidebarMenu className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isExpanded = expandedItems.includes(item.title);
              const hasActiveSubmenu = item.submenu?.some(sub => isActive(sub.url));
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`${getNavCls(isActive(item.url) || hasActiveSubmenu)} h-10 px-3`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => item.hasSubmenu ? toggleExpanded(item.title) : navigate(item.url)}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </button>
                      {item.hasSubmenu && (
                        <button
                          onClick={() => toggleExpanded(item.title)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </SidebarMenuButton>
                  
                  {/* Submenu */}
                  {item.hasSubmenu && isExpanded && item.submenu && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <SidebarMenuButton 
                          key={subItem.title}
                          asChild
                          className={`${getSubmenuCls(isActive(subItem.url))} h-8 px-3 text-xs`}
                        >
                          <button
                            onClick={() => navigate(subItem.url)}
                            className="w-full text-left"
                          >
                            {subItem.title}
                          </button>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
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