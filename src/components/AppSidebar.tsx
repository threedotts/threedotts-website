import { useState } from "react";
import { BarChart3, User, Building } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { 
    title: "Overview", 
    url: "/dashboard", 
    icon: BarChart3,
    description: "Dados estatísticos gerais"
  },
];

const bottomMenuItems = [
  { 
    title: "Perfil", 
    url: "/dashboard/profile", 
    icon: User,
    description: "Configurações do perfil"
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

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent className="flex flex-col h-full">
        {/* Organization Info */}
        {state !== "collapsed" && profile && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-sidebar-primary" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profile.organization_name}
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  {profile.organization_members_count} membros
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <div className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className={state === "collapsed" ? "sr-only" : ""}>
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavCls(isActive(item.url))}
                      >
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors"
                          title={state === "collapsed" ? item.title : undefined}
                        >
                          <IconComponent className="h-5 w-5 flex-shrink-0" />
                          {state !== "collapsed" && (
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                              <p className="text-xs text-sidebar-foreground/70">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Bottom Menu */}
        <div className="border-t border-sidebar-border">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavCls(isActive(item.url))}
                      >
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full flex items-center space-x-3 p-2 rounded-lg transition-colors"
                          title={state === "collapsed" ? item.title : undefined}
                        >
                          <IconComponent className="h-5 w-5 flex-shrink-0" />
                          {state !== "collapsed" && (
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium">
                                {item.title}
                              </span>
                              <p className="text-xs text-sidebar-foreground/70">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </div>
      </SidebarContent>
    </Sidebar>
  );
}