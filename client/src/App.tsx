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
import Departments from "./pages/Departments";
import Formulas from "./pages/Formulas";
import History from "./pages/History";
import DashboardVisaoGeral from "./pages/DashboardVisaoGeral";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import DashboardMentor from "./pages/DashboardMentor";

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
      <Route path={"/departamentos"} component={Departments} />
      <Route path={"/formulas"} component={Formulas} />
      <Route path={"/historico"} component={History} />
      <Route path={"/dashboard/visao-geral"} component={DashboardVisaoGeral} />
      <Route path={"/dashboard/empresa/:codigo"} component={DashboardEmpresa} />
      <Route path={"/dashboard/mentor"} component={DashboardMentor} />
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
