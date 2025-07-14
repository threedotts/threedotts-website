import { useState } from "react";
import { BarChart3, User, Building, LogOut } from "lucide-react";
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
      ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-l-3 border-primary font-semibold shadow-lg shadow-primary/10" 
      : "text-sidebar-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/2 hover:text-primary hover:shadow-md hover:shadow-primary/5 transition-all duration-300 ease-out hover:scale-[1.02]";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm">
      <SidebarTrigger className="m-4 hover:bg-primary/10 hover:shadow-lg transition-all duration-300 rounded-xl p-2" />

      <SidebarContent className="flex flex-col h-full">
        {/* Organization Info */}
        {state !== "collapsed" && profile && (
          <div className="p-5 mx-4 mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-md">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {profile.organization_name}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {profile.organization_members_count} membros
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <div className="flex-1 px-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-3">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={`${getNavCls(isActive(item.url))} rounded-xl mx-0 px-4 py-4 min-h-[56px] group`}
                      >
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full flex items-center space-x-4 text-left"
                          title={state === "collapsed" ? item.title : undefined}
                        >
                          <div className={`p-2.5 rounded-xl ${isActive(item.url) ? 'bg-primary/25 shadow-lg shadow-primary/20' : 'bg-muted/30 group-hover:bg-primary/15 group-hover:shadow-md'} transition-all duration-300`}>
                            <IconComponent className="h-5 w-5 flex-shrink-0" />
                          </div>
                          {state !== "collapsed" && (
                            <div className="flex-1">
                              <span className="text-sm font-semibold block leading-tight">
                                {item.title}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1 font-medium">
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
        <div className="px-4 pb-6">
          <div className="border-t border-gradient-to-r from-border/50 to-border/20 pt-6 mb-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-3">
                  {bottomMenuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild
                          className={`${getNavCls(isActive(item.url))} rounded-xl mx-0 px-4 py-4 min-h-[56px] group`}
                        >
                          <button
                            onClick={() => navigate(item.url)}
                            className="w-full flex items-center space-x-4 text-left"
                            title={state === "collapsed" ? item.title : undefined}
                          >
                            <div className={`p-2.5 rounded-xl ${isActive(item.url) ? 'bg-primary/25 shadow-lg shadow-primary/20' : 'bg-muted/30 group-hover:bg-primary/15 group-hover:shadow-md'} transition-all duration-300`}>
                              <IconComponent className="h-5 w-5 flex-shrink-0" />
                            </div>
                            {state !== "collapsed" && (
                              <div className="flex-1">
                                <span className="text-sm font-semibold block leading-tight">
                                  {item.title}
                                </span>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">
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
            <div className="p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-border/30 shadow-sm backdrop-blur-sm">
              <div className="text-sm text-muted-foreground truncate font-medium">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}