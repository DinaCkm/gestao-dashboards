import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Upload, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  BarChart3, 
  Settings,
  FileText,
  Calculator,
  User,
  UserCheck,
  GraduationCap,
  BookOpen,
  Target,
  ClipboardEdit,
  ClipboardCheck,
  PlayCircle,
  Compass
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import CustomLogin from "./CustomLogin";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: ("admin" | "manager" | "user")[];
};

type MenuItemExtended = MenuItem & {
  requireConsultorId?: boolean; // Só mostra se user tem consultorId (mentor)
  hideIfConsultorId?: boolean; // Esconde se user tem consultorId (gestor de empresa)
};

const allMenuItems: MenuItemExtended[] = [
  // === ADMINISTRADOR ===
  { icon: LayoutDashboard, label: "Painel Admin", path: "/", roles: ["admin"] },
  { icon: Upload, label: "Gestão de Planilhas", path: "/upload", roles: ["admin"] },
  { icon: FileSpreadsheet, label: "Relatório de Performance", path: "/performance-upload", roles: ["admin"] },
  { icon: BarChart3, label: "Visão Geral", path: "/dashboard/visao-geral", roles: ["admin"] },
  
  // === MENTORES (admin vê como "Dashboard Mentores", mentor vê como "Meu Dashboard") ===
  { icon: UserCheck, label: "Dashboard Mentores", path: "/dashboard/mentor", roles: ["admin"] },
  { icon: UserCheck, label: "Meu Dashboard", path: "/dashboard/mentor", roles: ["manager"], requireConsultorId: true },
  { icon: ClipboardEdit, label: "Registro de Mentoria", path: "/registro-mentoria", roles: ["admin", "manager"] },
  { icon: ClipboardCheck, label: "Assessment / PDI", path: "/assessment", roles: ["admin", "manager"] },
  
  // === GERENTES DE EMPRESA ===
  { icon: Building2, label: "Por Empresa", path: "/dashboard/empresa", roles: ["admin"] },
  { icon: Building2, label: "Minha Empresa", path: "/dashboard/gestor", roles: ["manager"], hideIfConsultorId: true },
  
  // === ALUNO INDIVIDUAL ===
  { icon: Compass, label: "Portal do Aluno", path: "/portal-aluno", roles: ["user"] },
  { icon: User, label: "Meu Painel", path: "/meu-dashboard", roles: ["user"] },
  { icon: PlayCircle, label: "Tutoriais", path: "/tutoriais", roles: ["user"] },
  
  // === CADASTROS ===
  { icon: Users, label: "Cadastros", path: "/cadastros", roles: ["admin"] },
  
  // === RELATÓRIOS E GESTÃO ===
  { icon: FileText, label: "Relatórios", path: "/relatorios", roles: ["admin", "manager"] },
  { icon: GraduationCap, label: "Turmas", path: "/turmas", roles: ["admin"] },
  { icon: BookOpen, label: "Trilhas e Competências", path: "/trilhas-competencias", roles: ["admin"] },
  { icon: Target, label: "Plano Individual", path: "/plano-individual", roles: ["admin"] },
  { icon: Calculator, label: "Fórmulas", path: "/formulas", roles: ["admin"] },
  // Histórico agora está dentro de Gestão de Planilhas
  // { icon: Settings, label: "Configurações", path: "/configuracoes", roles: ["admin"] }, // TODO: implementar
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return <CustomLogin />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Filter menu items based on user role and consultorId
  const menuItems = useMemo(() => {
    const userRole = user?.role || "user";
    const hasConsultorId = !!(user as any)?.consultorId;
    return allMenuItems.filter(item => {
      // Filtrar por role
      if (item.roles && !item.roles.includes(userRole as "admin" | "manager" | "user")) return false;
      // Filtrar por consultorId (mentor vs gestor)
      if (item.requireConsultorId && !hasConsultorId) return false;
      if (item.hideIfConsultorId && hasConsultorId) return false;
      return true;
    });
  }, [user?.role, (user as any)?.consultorId]);

  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      admin: { label: "Admin", className: "bg-primary/20 text-primary" },
      manager: { label: "Gerente", className: "bg-secondary/20 text-secondary" },
      user: { label: "Usuário", className: "bg-muted text-muted-foreground" },
    };
    return badges[role] || badges.user;
  };

  const badge = getRoleBadge(user?.role || "user");

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">BEM</span>
                  </div>
                  <span className="font-bold tracking-tight text-sidebar-foreground text-sm whitespace-nowrap">
                    ECOSSISTEMA DO BEM
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">BEM</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${isActive ? "bg-sidebar-accent glow-orange" : ""}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className={isActive ? "text-foreground font-medium" : ""}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary/20 to-secondary/20">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate leading-none">
                        {user?.name || "-"}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/individual")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="gradient-bg">
        {isMobile && (
          <div className="flex border-b border-border h-14 items-center justify-between bg-background/80 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground font-medium">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
