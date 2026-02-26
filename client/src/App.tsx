import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import IndividualDashboard from "./pages/IndividualDashboard";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Turmas from "./pages/Turmas";
import Formulas from "./pages/Formulas";
// History page merged into Upload
import DashboardVisaoGeral from "./pages/DashboardVisaoGeral";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import DashboardMentor from "./pages/DashboardMentor";
import AdminCadastros from "./pages/AdminCadastros";
import PorEmpresa from "./pages/PorEmpresa";
import TrilhasCompetencias from "./pages/TrilhasCompetencias";
import PlanoIndividual from "./pages/PlanoIndividual";
import DashboardAluno from "./pages/DashboardAluno";
import RegistroMentoria from "./pages/RegistroMentoria";
import DashboardGestor from "./pages/DashboardGestor";
import DashboardMeuPerfil from "./pages/DashboardMeuPerfil";
import Assessment from "./pages/Assessment";
import PortalAluno from "./pages/PortalAluno";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/upload"} component={Upload} />
      <Route path={"/dashboard/admin"} component={AdminDashboard} />
      <Route path={"/dashboard/gerencial"} component={ManagerDashboard} />
      <Route path={"/dashboard/individual"} component={IndividualDashboard} />
      <Route path={"/relatorios"} component={Reports} />
      <Route path={"/usuarios"} component={Users} />
      <Route path={"/turmas"} component={Turmas} />
      <Route path={"/formulas"} component={Formulas} />
      {/* Histórico agora está dentro da página de Upload */}
      <Route path={"/dashboard/visao-geral"} component={DashboardVisaoGeral} />
      <Route path={"/dashboard/empresa"} component={PorEmpresa} />
      <Route path={"/dashboard/empresa/:codigo"} component={DashboardEmpresa} />
      <Route path={"/dashboard/mentor"} component={DashboardMentor} />
      <Route path={"/cadastros"} component={AdminCadastros} />
      <Route path={"/trilhas-competencias"} component={TrilhasCompetencias} />
      <Route path={"/plano-individual"} component={PlanoIndividual} />
      <Route path={"/dashboard/aluno"} component={DashboardAluno} />
      <Route path={"/meu-dashboard"} component={DashboardMeuPerfil} />
      <Route path={"/registro-mentoria"} component={RegistroMentoria} />
      <Route path={"/dashboard/gestor"} component={DashboardGestor} />
      <Route path={"/assessment"} component={Assessment} />
      <Route path={"/portal-aluno"} component={PortalAluno} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
