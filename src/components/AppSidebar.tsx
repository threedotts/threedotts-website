import { useState } from "react";
import { BarChart3, User, Building } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium shadow-sm" 
      : "text-sidebar-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200 ease-in-out";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarTrigger className="m-3 hover:bg-primary/10 transition-colors duration-200" />

      <SidebarContent className="flex flex-col h-full bg-background/50">
        {/* Organization Info */}
        {state !== "collapsed" && profile && (
          <div className="p-4 mx-3 mb-4 bg-gradient-card rounded-lg border border-border/30 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {profile.organization_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {profile.organization_members_count} membros
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <div className="flex-1 px-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={`${getNavCls(isActive(item.url))} rounded-lg mx-0 px-3 py-3 min-h-[48px]`}
                      >
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full flex items-center space-x-3 text-left"
                          title={state === "collapsed" ? item.title : undefined}
                        >
                          <div className={`p-1.5 rounded-md ${isActive(item.url) ? 'bg-primary/20' : 'bg-transparent'} transition-colors duration-200`}>
                            <IconComponent className="h-5 w-5 flex-shrink-0" />
                          </div>
                          {state !== "collapsed" && (
                            <div className="flex-1">
                              <span className="text-sm font-medium block">
                                {item.title}
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
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
        <div className="px-3 pb-4">
          <div className="border-t border-border/30 pt-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {bottomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild
                          className={`${getNavCls(isActive(item.url))} rounded-lg mx-0 px-3 py-3 min-h-[48px]`}
                        >
                          <button
                            onClick={() => navigate(item.url)}
                            className="w-full flex items-center space-x-3 text-left"
                            title={state === "collapsed" ? item.title : undefined}
                          >
                            <div className={`p-1.5 rounded-md ${isActive(item.url) ? 'bg-primary/20' : 'bg-transparent'} transition-colors duration-200`}>
                              <IconComponent className="h-5 w-5 flex-shrink-0" />
                            </div>
                            {state !== "collapsed" && (
                              <div className="flex-1">
                                <span className="text-sm font-medium block">
                                  {item.title}
                                </span>
                                <p className="text-xs text-muted-foreground mt-0.5">
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

          {/* User Email */}
          {state !== "collapsed" && user && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/20">
              <div className="text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}