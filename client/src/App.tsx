import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RoleProvider } from "./contexts/RoleContext";

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
import Login from "./pages/Login";
// History page merged into Upload
import DashboardVisaoGeral from "./pages/DashboardVisaoGeral";
import CiclosTurmas from "./pages/CiclosTurmas";
import DashboardEmpresa from "./pages/DashboardEmpresa";
import DashboardMentor from "./pages/DashboardMentor";
import AdminCadastros from "./pages/AdminCadastros";
import AdminPlataformaAulas from "./pages/AdminPlataformaAulas";
import AdminAgendamentos from "./pages/AdminAgendamentos";
import PorEmpresa from "./pages/PorEmpresa";
import TrilhasCompetencias from "./pages/TrilhasCompetencias";
import PlanoIndividual from "./pages/PlanoIndividual";
import DashboardAluno from "./pages/DashboardAluno";
import Performance from "./pages/Performance";
import EvolucaoAluno from "./pages/EvolucaoAluno";
import RegistroMentoria from "./pages/RegistroMentoria";
import DashboardGestor from "./pages/DashboardGestor";
import RankingGeralEngajamento from "./pages/RankingGeralEngajamento";
import DashboardMeuPerfil from "./pages/DashboardMeuPerfil";
import Assessment from "./pages/Assessment";
import NovoAssessment from "./pages/NovoAssessment";
// PortalAluno removido - unificado com DashboardMeuPerfil
import Tutoriais from "./pages/Tutoriais";
import PerformanceUpload from "./pages/PerformanceUpload";
import WebinarsAdmin from "./pages/WebinarsAdmin";
import MuralAluno from "./pages/MuralAluno";
import AvisosAdmin from "./pages/AvisosAdmin";
import OnboardingAluno from "./pages/OnboardingAluno";
import AtividadesPraticas from "./pages/AtividadesPraticas";
import DemonstrativoMentorias from "./pages/DemonstrativoMentorias";
import RelatorioMentorias from "./pages/RelatorioMentorias";
import MetasDesenvolvimento from "./pages/MetasDesenvolvimento";
import MinhasMetasAluno from "./pages/MinhasMetasAluno";
import MetasGestor from "./pages/MetasGestor";
import BibliotecaTarefas from "./pages/BibliotecaTarefas";
import CursosDisponiveis from "./pages/admin/CursosDisponiveis";
import CursosAluno from "./pages/aluno/CursosAluno";
import AtividadesExtrasAdmin from "./pages/admin/AtividadesExtras";
import AtividadesExtrasAluno from "./pages/aluno/AtividadesExtrasAluno";
import MentorConfiguracoes from "./pages/MentorConfiguracoes";
import EditarMentorias from "./pages/EditarMentorias";
import OnboardingTracking from "./pages/admin/OnboardingTracking";
import PainelRevisoes from "./pages/admin/PainelRevisoes";
import BoasVindasGestor from "./pages/BoasVindasGestor";
import PrecificacaoSessoes from "./pages/PrecificacaoSessoes";
import CompetenciasCompTec from "./pages/admin/CompetenciasCompTec";
import MentorCompetenciasCompTec from "./pages/mentor/MentorCompetenciasCompTec";
import AlunoCatalogo from "./pages/aluno/AlunoCatalogo";

import AdminAtividades from "./pages/admin/AdminAtividades";
import AdminAvaliacoes from "./pages/admin/AdminAvaliacoes";
import AdminDashboardCompTec from "./pages/admin/AdminDashboard";
import AdminQuestoes from "./pages/admin/AdminQuestoes";

import MentorListaAlunos from "./pages/mentor/MentorListaAlunos";
import MentorAtribuirCurso from "./pages/mentor/MentorAtribuirCurso";
import MentorProgressoAlunos from "./pages/mentor/MentorProgressoAlunos";

import AlunoDetalheCurso from "./pages/aluno/AlunoDetalheCurso";
import AlunoAtividade from "./pages/aluno/AlunoAtividade";
import AlunoConteudoCurso from "./pages/aluno/AlunoConteudoCurso";
import AlunoAvaliacao from "./pages/aluno/AlunoAvaliacao";
import AlunoResultadoAvaliacao from "./pages/aluno/AlunoResultadoAvaliacao";
import AlunoReflexaoFinal from "./pages/aluno/AlunoReflexaoFinal";
import OnboardingVideos from "./pages/admin/OnboardingVideos";
import BibliotecaPedagogica from "./pages/admin/BibliotecaPedagogica";
import AuditoriaResets from "./pages/admin/AuditoriaResets";
import VisualizarPDI from "./pages/VisualizarPDI";
import AutoRegistro from "./pages/AutoRegistro";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/registro"} component={AutoRegistro} />
      <Route path={"/"} component={Home} />
      <Route path={"/upload"} component={Upload} />
      <Route path={"/dashboard/admin"} component={AdminDashboard} />
      <Route path={"/dashboard/gerencial"} component={ManagerDashboard} />
      <Route path={"/dashboard/individual"} component={IndividualDashboard} />
      <Route path={"/relatorios"} component={Reports} />
      <Route path={"/usuarios"} component={Users} />
      <Route path={"/turmas"} component={Turmas} />
      <Route path={"/formulas"} component={Formulas} />
      <Route path={"/dashboard/visao-geral"} component={DashboardVisaoGeral} />
      <Route path={"/dashboard/empresa"} component={PorEmpresa} />
      <Route path={"/dashboard/empresa/:codigo"} component={DashboardEmpresa} />
      <Route path={"/dashboard/mentor"} component={DashboardMentor} />
      <Route path={"/cadastros"} component={AdminCadastros} />
      <Route path={"/admin/plataforma-aulas"} component={AdminPlataformaAulas} />
      <Route path={"/agendamentos"} component={AdminAgendamentos} />
      <Route path={"/trilhas-competencias"} component={TrilhasCompetencias} />
      <Route path={"/plano-individual"} component={PlanoIndividual} />
      <Route path={"/dashboard/aluno"} component={DashboardAluno} />
      <Route path={"/meu-dashboard"} component={DashboardMeuPerfil} />
      <Route path={"/portal-aluno"} component={DashboardMeuPerfil} />
      <Route path={"/registro-mentoria"} component={RegistroMentoria} />
      <Route path={"/dashboard/gestor"} component={DashboardGestor} />
      <Route path={"/dashboard/ranking-geral-engajamento"} component={RankingGeralEngajamento} />
      <Route path={"/assessment"} component={Assessment} />
      <Route path={"/assessment/novo/:alunoId"} component={NovoAssessment} />
      <Route path={"/tutoriais"} component={Tutoriais} />
      <Route path={"/performance-upload"} component={PerformanceUpload} />
      <Route path={"/webinars"} component={WebinarsAdmin} />
      <Route path={"/mural"} component={MuralAluno} />
      <Route path={"/performance"} component={Performance} />
      <Route path={"/evolucao"} component={EvolucaoAluno} />
      <Route path={"/onboarding"} component={OnboardingAluno} />
      <Route path={"/avisos"} component={AvisosAdmin} />
      <Route path={"/atividades-praticas"} component={AtividadesPraticas} />
      <Route path={"/demonstrativo-mentorias"} component={DemonstrativoMentorias} />
      <Route path={"/relatorio-mentorias"} component={RelatorioMentorias} />
      <Route path={"/metas"} component={MetasDesenvolvimento} />
      <Route path={"/minhas-metas"} component={MinhasMetasAluno} />
      <Route path={"/metas-gestor"} component={MetasGestor} />
      <Route path={"/biblioteca-tarefas"} component={BibliotecaTarefas} />
      <Route path={"/cursos"} component={CursosDisponiveis} />

      <Route path={"/meus-cursos"} component={CursosAluno} />
      <Route path={"/atividades-extras"} component={AtividadesExtrasAdmin} />
      <Route path={"/minhas-atividades"} component={AtividadesExtrasAluno} />
      <Route path={"/editar-mentorias"} component={EditarMentorias} />
      <Route path={"/onboarding-tracking"} component={OnboardingTracking} />
      <Route path={"/painel-revisoes"} component={PainelRevisoes} />
      <Route path={"/mentor/configuracoes"} component={MentorConfiguracoes} />
      <Route path={"/boas-vindas-gestor"} component={BoasVindasGestor} />
      <Route path={"/dashboard/ciclos-turmas"} component={CiclosTurmas} />
      <Route path={"/precificacao-sessoes"} component={PrecificacaoSessoes} />
      <Route path={"/competencias-comp-tec"} component={CompetenciasCompTec} />
      <Route path={"/mentor/competencias-comp-tec"} component={MentorCompetenciasCompTec} />
      <Route path={"/aluno/competencias-comp-tec"} component={AlunoCatalogo} />

      <Route path={"/admin/competencias-comp-tec/dashboard"} component={AdminDashboardCompTec} />
      <Route path={"/admin/competencias-comp-tec/atividades"} component={AdminAtividades} />
      <Route path={"/admin/competencias-comp-tec/avaliacoes"} component={AdminAvaliacoes} />
      <Route path={"/admin/avaliacoes"} component={AdminAvaliacoes} />
      <Route path={"/admin/competencias-comp-tec/questoes"} component={AdminQuestoes} />

      <Route path={"/mentor/competencias-comp-tec/alunos"} component={MentorListaAlunos} />
      <Route path={"/mentor/competencias-comp-tec/atribuir"} component={MentorAtribuirCurso} />
      <Route path={"/mentor/atribuir-cursos"} component={MentorAtribuirCurso} />
      <Route path={"/admin/atribuir-cursos"} component={MentorAtribuirCurso} />
      <Route path={"/mentor/competencias-comp-tec/progresso"} component={MentorProgressoAlunos} />

      <Route path={"/aluno/competencias-comp-tec/detalhe"} component={AlunoDetalheCurso} />
      <Route path={"/aluno/competencias-comp-tec/atividade"} component={AlunoAtividade} />
      <Route path={"/aluno/competencias-comp-tec/conteudo"} component={AlunoConteudoCurso} />
      <Route path={"/aluno/competencias-comp-tec/avaliacao"} component={AlunoAvaliacao} />
      <Route path={"/aluno/competencias-comp-tec/resultado"} component={AlunoResultadoAvaliacao} />
      <Route path={"/aluno/competencias-comp-tec/reflexao"} component={AlunoReflexaoFinal} />
      <Route path={"/admin/onboarding-videos"} component={OnboardingVideos} />
      <Route path={"/admin/biblioteca-pedagogica"} component={BibliotecaPedagogica} />
      <Route path={"/admin/auditoria-resets"} component={AuditoriaResets} />
      <Route path={"/pdi/nivel/:contratoNivelId"} component={VisualizarPDI} />
      <Route path={"/pdi/:pdiId"} component={VisualizarPDI} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <RoleProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </RoleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
