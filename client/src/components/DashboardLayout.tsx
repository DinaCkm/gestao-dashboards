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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Compass,
  Video,
  Megaphone,
  ExternalLink,
  Calendar,
  Flag,
  ChevronRight,
  DollarSign,
  Layers,
  Lock,
  Library,
  Sparkles,
  Zap,
  Bell,
  CalendarDays,
  Edit3,
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import CustomLogin from "./CustomLogin";
import RoleSwitcher from "@/components/RoleSwitcher";
import NotificationBell from "@/components/NotificationBell";

// ============================================================
// TIPOS
// ============================================================

type SubMenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

type MenuGroup = {
  icon: React.ElementType;
  label: string;
  defaultOpen?: boolean;
  items: SubMenuItem[];
};

type FlatMenuItem = {
  icon: React.ElementType;
  label: string;
  path: string;
};

// ============================================================
// MENU DO ADMINISTRADOR - 7 ÁREAS
// ============================================================

const adminMenuGroups: MenuGroup[] = [
  {
    icon: GraduationCap,
    label: "Alunos",
    items: [
      { icon: ClipboardCheck, label: "Assessment / PDI", path: "/assessment" },
      { icon: Target, label: "Plano Individual", path: "/plano-individual" },
      { icon: Flag, label: "Metas de Desenvolvimento", path: "/metas" },
      { icon: ClipboardEdit, label: "Atividades Práticas", path: "/atividades-praticas" },
    ],
  },
  {
    icon: UserCheck,
    label: "Mentores",
    items: [
      { icon: BarChart3, label: "Dashboard de Mentores", path: "/dashboard/mentor" },
      { icon: Calendar, label: "Sessões de Mentoria", path: "/demonstrativo-mentorias" },
      { icon: CalendarDays, label: "Painel de Agendamentos", path: "/agendamentos" },
    ],
  },
  {
    icon: Building2,
    label: "Empresas e Resultados",
    items: [
      { icon: BarChart3, label: "Visão Geral", path: "/dashboard/visao-geral" },
      { icon: Building2, label: "Por Empresa", path: "/dashboard/empresa" },
    ],
  },
  {
    icon: Settings,
    label: "Parametrização",
    items: [
      { icon: Users, label: "Cadastros", path: "/cadastros" },
      { icon: GraduationCap, label: "Turmas", path: "/turmas" },
      { icon: BookOpen, label: "Trilhas e Competências", path: "/trilhas-competencias" },
      { icon: Calculator, label: "Fórmulas", path: "/formulas" },
      { icon: Library, label: "Biblioteca de Tarefas", path: "/biblioteca-tarefas" },
      { icon: Edit3, label: "Editar Mentorias", path: "/editar-mentorias" },
    ],
  },
  {
    icon: Megaphone,
    label: "Conteúdo e Comunicação",
    items: [
      { icon: Video, label: "Webinars", path: "/webinars" },
      { icon: Bell, label: "Avisos e Comunicados", path: "/avisos" },
      { icon: BookOpen, label: "Cursos", path: "/cursos" },
      { icon: Zap, label: "Atividades Extras", path: "/atividades-extras" },
    ],
  },
  {
    icon: FileText,
    label: "Dados e Relatórios",
    items: [
      { icon: Upload, label: "Upload de Planilhas", path: "/upload" },
      { icon: FileSpreadsheet, label: "Relatórios", path: "/relatorios" },
    ],
  },
];

// ============================================================
// MENUS PARA OUTROS PERFIS (mentor, gestor, aluno)
// ============================================================

type MenuItemExtended = {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: ("admin" | "manager" | "user")[];
  requireConsultorId?: boolean;
  hideIfConsultorId?: boolean;
};

const otherMenuItems: MenuItemExtended[] = [
  // === MENTOR ===
  { icon: UserCheck, label: "Meu Dashboard", path: "/dashboard/mentor", roles: ["manager"], requireConsultorId: true },
  { icon: ClipboardEdit, label: "Registro de Mentoria", path: "/registro-mentoria", roles: ["manager"], requireConsultorId: true },
  { icon: ClipboardCheck, label: "Assessment / PDI", path: "/assessment", roles: ["manager"], requireConsultorId: true },
  { icon: Target, label: "Plano Individual", path: "/plano-individual", roles: ["manager"], requireConsultorId: true },
  { icon: Flag, label: "Metas de Desenvolvimento", path: "/metas", roles: ["manager"], requireConsultorId: true },
  { icon: ClipboardEdit, label: "Atividades Práticas", path: "/atividades-praticas", roles: ["manager"], requireConsultorId: true },
  { icon: FileText, label: "Relatórios dos Meus Alunos", path: "/relatorios", roles: ["manager"], requireConsultorId: true },
  { icon: Settings, label: "Configurações", path: "/mentor/configuracoes", roles: ["manager"], requireConsultorId: true },
  
  // === GERENTE DE EMPRESA ===
  { icon: Building2, label: "Minha Empresa", path: "/dashboard/gestor", roles: ["manager"], hideIfConsultorId: true },
  { icon: Calendar, label: "Sessões de Mentoria", path: "/demonstrativo-mentorias", roles: ["manager"], hideIfConsultorId: true },
  { icon: Flag, label: "Metas de Desenvolvimento", path: "/metas-gestor", roles: ["manager"], hideIfConsultorId: true },
  { icon: FileText, label: "Relatórios", path: "/relatorios", roles: ["manager"], hideIfConsultorId: true },
  
  // === ALUNO ===
  { icon: Compass, label: "Portal do Aluno", path: "/meu-dashboard", roles: ["user"] },
  { icon: GraduationCap, label: "Cursos Disponíveis", path: "/meus-cursos", roles: ["user"] },
  { icon: Zap, label: "Atividades Extras", path: "/minhas-atividades", roles: ["user"] },
  { icon: PlayCircle, label: "Tutoriais", path: "/tutoriais", roles: ["user"] },
];

// ============================================================
// CONSTANTES
// ============================================================

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

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

// ============================================================
// CONTEÚDO DO LAYOUT
// ============================================================

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

  const isAdmin = user?.role === "admin";
  const hasConsultorId = !!(user as any)?.consultorId;

  // Para admin, determinar qual grupo está ativo (para abrir automaticamente)
  const activeGroupIndex = useMemo(() => {
    if (!isAdmin) return -1;
    const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
    const currentParams = new URLSearchParams(currentSearch);
    const currentTab = currentParams.get("tab");
    const locationBase = location.split("?")[0];
    
    return adminMenuGroups.findIndex(group =>
      group.items.some(item => {
        const [itemBase, itemQuery] = item.path.split("?");
        if (itemQuery) {
          const itemTab = new URLSearchParams(itemQuery).get("tab");
          return locationBase === itemBase && currentTab === itemTab;
        }
        // Para items sem query, verificar match simples
        if (locationBase === itemBase) {
          // Se há outros items com query param na mesma base, só match se não tem tab
          const hasQuerySiblings = adminMenuGroups.some(g =>
            g.items.some(i => i.path.startsWith(itemBase + "?"))
          );
          if (hasQuerySiblings) {
            return !currentTab || currentTab === "acesso";
          }
          return true;
        }
        return location.startsWith(itemBase + "/");
      })
    );
  }, [location, isAdmin]);

  // Para não-admin, filtrar itens do menu
  const filteredOtherItems = useMemo(() => {
    const userRole = user?.role || "user";
    return otherMenuItems.filter(item => {
      if (!item.roles.includes(userRole as "admin" | "manager" | "user")) return false;
      if (item.requireConsultorId && !hasConsultorId) return false;
      if (item.hideIfConsultorId && hasConsultorId) return false;
      return true;
    });
  }, [user?.role, hasConsultorId]);

  // Encontrar label ativo para mobile header
  const activeLabel = useMemo(() => {
    if (location === "/") return "Painel Admin";
    if (isAdmin) {
      for (const group of adminMenuGroups) {
        for (const item of group.items) {
          const basePath = item.path.split("?")[0];
          if (location === basePath || location.startsWith(basePath + "/")) {
            return item.label;
          }
        }
      }
    } else {
      const found = filteredOtherItems.find(item => item.path === location);
      if (found) return found.label;
    }
    return "Menu";
  }, [location, isAdmin, filteredOtherItems]);

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

  const getRoleBadge = (role: string, hasConsultor: boolean) => {
    if (role === 'admin') return { label: "Admin", className: "bg-primary/20 text-primary" };
    if (role === 'manager' && hasConsultor) return { label: "Mentor", className: "bg-orange-100 text-orange-700" };
    if (role === 'manager') return { label: "Gerente", className: "bg-secondary/20 text-secondary" };
    return { label: "Aluno", className: "bg-green-100 text-green-700" };
  };

  const badge = getRoleBadge(user?.role || "user", hasConsultorId);

  // Verifica se um path está ativo (considerando query params e sub-rotas)
  const isPathActive = (path: string) => {
    const [itemBase, itemQuery] = path.split("?");
    const locationBase = location.split("?")[0];
    
    // Se o item tem query param (ex: /cadastros?tab=mentores)
    if (itemQuery) {
      const itemParams = new URLSearchParams(itemQuery);
      const itemTab = itemParams.get("tab");
      if (itemTab) {
        // Verificar se estamos na mesma base path E com o mesmo tab
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const currentParams = new URLSearchParams(currentSearch);
        const currentTab = currentParams.get("tab");
        return locationBase === itemBase && currentTab === itemTab;
      }
    }
    
    // Para paths sem query params, verificar se não há outro item com query param que seria mais específico
    // Ex: /cadastros sem tab deve ser ativo quando não há ?tab= na URL
    const hasQueryItems = adminMenuGroups.some(g => 
      g.items.some(i => i.path.startsWith(itemBase + "?"))
    );
    if (hasQueryItems && !itemQuery) {
      const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
      const currentParams = new URLSearchParams(currentSearch);
      const currentTab = currentParams.get("tab");
      // Se estamos em /cadastros sem tab, é a lista de alunos
      return (locationBase === itemBase && !currentTab) || (locationBase === itemBase && currentTab === "acesso");
    }
    
    return locationBase === itemBase || location.startsWith(itemBase + "/");
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-sidebar"
          disableTransition={isResizing}
        >
          {/* ===== HEADER ===== */}
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
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                    alt="B.E.M."
                    className="h-7 object-contain shrink-0"
                  />
                  <span className="font-bold tracking-tight text-sidebar-foreground text-sm whitespace-nowrap">
                    ECOSSISTEMA DO BEM
                  </span>
                </div>
              ) : (
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663192322263/5n7arrGNHjNdoFCMzyGXcY/eco_do_bem_logo_d2ee37e3.png"
                  alt="B.E.M."
                  className="h-7 object-contain"
                />
              )}
            </div>
          </SidebarHeader>

          {/* ===== CONTEÚDO DO MENU ===== */}
          <SidebarContent className="gap-0 py-2 overflow-y-auto">
            {isAdmin ? (
              <>
                {/* PAINEL INICIAL - item fixo no topo */}
                <SidebarGroup className="py-1">
                  <SidebarMenu className="px-0">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={location === "/"}
                        onClick={() => setLocation("/")}
                        tooltip="Painel Inicial"
                        className={`h-10 transition-all font-normal ${location === "/"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <LayoutDashboard
                          className={`h-4 w-4 ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className={location === "/" ? "text-foreground font-medium" : ""}>Painel Inicial</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>

                {/* 7 ÁREAS COLAPSÁVEIS */}
                {adminMenuGroups.map((group, groupIdx) => {
                  const isGroupActive = activeGroupIndex === groupIdx;
                  return (
                    <Collapsible
                      key={group.label}
                      defaultOpen={isGroupActive}
                      className="group/collapsible"
                    >
                      <SidebarGroup className="py-0.5">
                        <SidebarMenu className="px-0">
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                tooltip={group.label}
                                className={`h-10 transition-all font-normal ${isGroupActive
                                  ? "text-primary font-medium"
                                  : "hover:bg-sidebar-accent/50"
                                }`}
                              >
                                <group.icon
                                  className={`h-4 w-4 ${isGroupActive ? "text-primary" : "text-muted-foreground"}`}
                                />
                                <span className="flex-1 text-left">{group.label}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {group.items.map(item => {
                                  const isActive = isPathActive(item.path);
                                  // No more placeholders - all items are functional
                                  const isPlaceholder = false;
                                  return (
                                    <SidebarMenuSubItem key={item.path}>
                                      <SidebarMenuSubButton
                                        isActive={isActive}
                                        onClick={() => {
                                          if (isPlaceholder) {
                                            // Import toast dynamically
                                            import("sonner").then(({ toast }) => {
                                              toast.info("Funcionalidade em breve", {
                                                description: `A gestão de ${item.label} será implementada em breve.`,
                                              });
                                            });
                                            return;
                                          }
                                          setLocation(item.path);
                                        }}
                                        className={`cursor-pointer h-8 ${isActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : isPlaceholder
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      >
                                        <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                        <span>{item.label}</span>
                                        {isPlaceholder && (
                                          <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                                        )}
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarGroup>
                    </Collapsible>
                  );
                })}
              </>
            ) : (
              /* MENU PARA MENTOR / GESTOR / ALUNO (flat, sem grupos) */
              <SidebarMenu className="px-2 py-1">
                {filteredOtherItems.map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={`${item.path}-${item.label}`}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-10 transition-all font-normal ${isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                        }`}
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
            )}

            {/* Botão P.D.I Evoluir - sai do sistema e redireciona */}
            <SidebarMenu className="px-2 py-1 mt-4">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="P.D.I Evoluir"
                  onClick={() => {
                    window.location.href = "https://www.evoluirckm.com";
                  }}
                  className="h-10 transition-all font-medium bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/20 hover:border-orange-500/40 text-orange-600 dark:text-orange-400 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span>P.D.I Evoluir</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          {/* ===== FOOTER ===== */}
          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <div className="mb-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2 justify-between">
                <RoleSwitcher />
                <NotificationBell />
              </div>
            </div>
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
                  onClick={() => {
                    if (hasConsultorId) {
                      setLocation("/mentor/configuracoes");
                    } else if (user?.role === 'user') {
                      setLocation("/meu-dashboard");
                    } else {
                      setLocation("/dashboard/individual");
                    }
                  }}
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
                    {activeLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <RoleSwitcher />
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
