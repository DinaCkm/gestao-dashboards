import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Search, CheckCircle2,
  User, CalendarDays, ClipboardCheck, Users2, Video,
  Target, BarChart3, FileText, GraduationCap, Sparkles,
  ChevronRight, BookMarked, X, PlayCircle, Map, TrendingUp, Award
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ============================================================
// CONTEÚDO HTML DOS TUTORIAIS
// ============================================================

const CONTEUDO_TUTORIAIS: Record<number, string> = {
  // ---- BLOCO 1: JORNADA DE ONBOARDING ----
  1: `
    <div class="space-y-5">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p class="text-blue-800 text-sm font-medium">🎯 Objetivo: Conhecer as seções da plataforma e entender como está organizada a sua jornada de desenvolvimento.</p>
      </div>
      <h3 class="text-base font-bold text-gray-800">📋 Menu Principal</h3>
      <ul class="space-y-1 text-sm text-gray-600">
        <li>📌 <strong>Onboarding</strong> — sua trilha de entrada no programa</li>
        <li>📌 <strong>Mural</strong> — comunicados e novidades</li>
        <li>📌 <strong>Portal do Aluno</strong> — hub central (tarefas, metas, sessões)</li>
        <li>📌 <strong>Performance</strong> — seus indicadores e resultados</li>
        <li>📌 <strong>Evolução</strong> — trilha de competências e ciclos</li>
      </ul>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 O programa é estruturado em um <strong>macrociclo</strong> (período total do contrato) dividido em <strong>ciclos mensais</strong>, cada um com foco em competências específicas.</p>
      </div>
    </div>
  `,

  2: `
    <div class="space-y-5">
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p class="text-purple-800 text-sm font-medium">🎯 Objetivo: Entender o que é o Assessment e qual é o seu papel nesse processo.</p>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-green-800 text-sm font-bold mb-1">✅ O que você precisa fazer agora:</p>
        <ol class="text-sm text-green-700 space-y-1 list-decimal list-inside">
          <li>Realize os testes disponíveis nesta etapa</li>
          <li>Responda com sinceridade — não há resposta certa ou errada</li>
        </ol>
      </div>
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p class="text-orange-800 text-sm font-bold">⚠️ Importante</p>
        <p class="text-orange-700 text-sm mt-1">A <strong>análise dos resultados e a definição da trilha</strong> serão feitas pela sua mentora no primeiro encontro. Ela usará os dados dos testes para personalizar seu plano de desenvolvimento.</p>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p class="text-blue-700 text-xs">💡 Quanto mais honesto você for, mais personalizado e eficaz será seu desenvolvimento.</p>
      </div>
    </div>
  `,

  3: `
    <div class="space-y-5">
      <div class="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p class="text-pink-800 text-sm font-medium">🎯 Objetivo: Escolher a mentora ideal para guiar seu desenvolvimento durante todo o macrociclo.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p>Após o Assessment, a etapa de escolha é liberada no Onboarding.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p>Leia a minibiografia e especialidades de cada mentora.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p>Escolha quem se alinha com as competências que você precisa desenvolver.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">4</div><p>Clique em <strong>"Selecionar Mentora"</strong> e confirme.</p></div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 A mentora escolhida será sua guia por todo o macrociclo — responsável por lançar metas, validar tarefas e acompanhar sua evolução.</p>
      </div>
    </div>
  `,

  4: `
    <div class="space-y-5">
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-green-800 text-sm font-medium">🎯 Objetivo: Agendar suas sessões quinzenais de mentoria.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p>Acesse a etapa de Agendamento no Onboarding.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p>Visualize os horários disponíveis da sua mentora e escolha o que melhor se encaixa na sua rotina.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p>Confirme o agendamento. O link do Google Meet chegará por e-mail e ficará disponível na plataforma.</p></div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 As sessões são quinzenais. Não perca nenhuma — elas são fundamentais para seu progresso e compõem o indicador de Engajamento.</p>
      </div>
    </div>
  `,

  5: `
    <div class="space-y-5">
      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p class="text-indigo-800 text-sm font-medium">🎯 Objetivo: Aproveitar ao máximo o primeiro encontro com sua mentora.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p>Acesse o link do Google Meet no horário combinado.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p>Participe com abertura — a mentora conduzirá o Assessment e definirá sua trilha.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p>Após a sessão, o relatório e o perfil comportamental ficam disponíveis no Onboarding.</p></div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 Prepare-se: pense em seus desafios profissionais atuais e no que você quer desenvolver. Isso enriquece muito a conversa.</p>
      </div>
    </div>
  `,

  6: `
    <div class="space-y-5">
      <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <p class="text-teal-800 text-sm font-medium">🎯 Objetivo: Entender como sua jornada de desenvolvimento está estruturada ao longo do macrociclo.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>Após o Assessment, sua mentora define sua <strong>Trilha de Competências</strong> — o conjunto de habilidades que você desenvolverá ao longo do programa.</p>
        <ul class="space-y-1 list-disc list-inside">
          <li>O macrociclo é dividido em <strong>ciclos mensais</strong></li>
          <li>Cada ciclo tem competências e metas específicas</li>
          <li>Você pode acompanhar tudo na aba <strong>Evolução</strong></li>
        </ul>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 Sua trilha é personalizada com base no seu perfil comportamental. Siga-a com consistência para atingir os 80% necessários para a certificação.</p>
      </div>
    </div>
  `,

  7: `
    <div class="space-y-5">
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p class="text-orange-800 text-sm font-medium">🎯 Objetivo: Entender o que são o PDI e as metas do seu desenvolvimento.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>O <strong>PDI (Plano de Desenvolvimento Individual)</strong> é criado pela sua mentora com base no Assessment. Ele define:</p>
        <ul class="space-y-1 list-disc list-inside">
          <li><strong>Metas Macro</strong> — objetivos grandes do macrociclo</li>
          <li><strong>Metas Micro</strong> — ações práticas dentro de cada ciclo mensal</li>
        </ul>
        <p>Acesse seu PDI na aba <strong>Portal do Aluno → Metas</strong>.</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 Cumprir as micro metas é fundamental para o indicador <strong>Jornada de Superação</strong> — que exige 100% das metas concluídas para a certificação.</p>
      </div>
    </div>
  `,

  8: `
    <div class="space-y-5">
      <div class="bg-rose-50 border border-rose-200 rounded-xl p-4">
        <p class="text-rose-800 text-sm font-medium">🎯 Objetivo: Confirmar seu comprometimento e iniciar oficialmente a jornada de desenvolvimento.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>A etapa de Aceite é a última do Onboarding. Nela você:</p>
        <ul class="space-y-1 list-disc list-inside">
          <li>Revisa o resumo do seu perfil e trilha</li>
          <li>Confirma o compromisso com o programa</li>
          <li>Libera o acesso completo à plataforma</li>
        </ul>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-green-800 text-sm">✅ Após o Aceite, o Onboarding está concluído e sua jornada de desenvolvimento começa oficialmente!</p>
      </div>
    </div>
  `,

  // ---- BLOCO 2: USANDO A PLATAFORMA NO DIA A DIA ----
  9: `
    <div class="space-y-5">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p class="text-blue-800 text-sm font-medium">🎯 Objetivo: Navegar com facilidade pela plataforma no dia a dia.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p><strong>Abas principais:</strong></p>
        <ul class="space-y-1 list-disc list-inside">
          <li><strong>Mural</strong> — comunicados, avisos e novidades do programa</li>
          <li><strong>Portal do Aluno</strong> — suas tarefas, metas, sessões e evolução</li>
          <li><strong>Performance</strong> — indicadores e progresso em tempo real</li>
          <li><strong>Evolução</strong> — trilha de competências e ciclos</li>
          <li><strong>Tutoriais</strong> — esta página, com guias de uso</li>
        </ul>
        <p>Fique atento aos <strong>e-mails automáticos</strong> do sistema — eles avisam sobre sessões, tarefas e webinars.</p>
      </div>
    </div>
  `,

  10: `
    <div class="space-y-5">
      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p class="text-indigo-800 text-sm font-medium">🎯 Objetivo: Aproveitar ao máximo cada sessão quinzenal com sua mentora.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p><strong>Acesse o link</strong> do Google Meet disponível no Portal do Aluno → Sessões.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p><strong>Prepare-se</strong> — revise suas metas e tarefas antes de cada sessão.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p><strong>Após a sessão</strong>, sua mentora registra o relatório e a nota de engajamento da sessão.</p></div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 A <strong>Nota da Mentora</strong> por sessão compõe o indicador de Engajamento. Participe ativamente!</p>
      </div>
    </div>
  `,

  11: `
    <div class="space-y-5">
      <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <p class="text-teal-800 text-sm font-medium">🎯 Objetivo: Acompanhar e avançar na sua trilha de competências.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>Acesse <strong>Evolução</strong> para ver:</p>
        <ul class="space-y-1 list-disc list-inside">
          <li>As competências do ciclo atual</li>
          <li>Os módulos e conteúdos associados</li>
          <li>Seu percentual de conclusão por competência</li>
        </ul>
        <p>Cada competência tem módulos de estudo. Conclua-os para avançar no indicador de <strong>Competências</strong> dentro do Engajamento.</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 Sua trilha é definida pela mentora com base no Assessment. Siga-a com consistência ao longo de cada ciclo mensal.</p>
      </div>
    </div>
  `,

  12: `
    <div class="space-y-5">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm font-medium">🎯 Objetivo: Executar, entregar e ter suas tarefas práticas validadas pela mentora.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">1</div><p>Acesse <strong>Portal do Aluno → Tarefas</strong> para ver as tarefas atribuídas pela mentora.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div><p>Execute a tarefa no mundo real e registre sua experiência na plataforma.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">3</div><p>Clique em <strong>"Enviar para Validação"</strong>. Sua mentora revisará e dará feedback.</p></div>
        <div class="flex gap-3"><div class="w-6 h-6 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0">4</div><p>Registre sua <strong>nota de aplicabilidade</strong> — o quanto conseguiu aplicar o aprendizado na prática.</p></div>
      </div>
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p class="text-orange-800 text-sm">⚠️ As tarefas entregues compõem o indicador de <strong>Tarefas</strong> no Engajamento. Entregar todas dentro do prazo é essencial para atingir 80% e garantir a certificação.</p>
      </div>
    </div>
  `,

  13: `
    <div class="space-y-5">
      <div class="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p class="text-violet-800 text-sm font-medium">🎯 Objetivo: Acompanhar e cumprir suas metas macro e micro ao longo do macrociclo.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>Acesse <strong>Portal do Aluno → Metas</strong> para visualizar:</p>
        <ul class="space-y-1 list-disc list-inside">
          <li><strong>Metas Macro</strong> — objetivos grandes definidos pela mentora para o macrociclo</li>
          <li><strong>Metas Micro</strong> — ações práticas dentro de cada ciclo mensal (até 5 por meta macro)</li>
        </ul>
        <p>Marque as micro metas como concluídas conforme as realiza. Isso alimenta o indicador <strong>Jornada de Superação</strong>.</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 O indicador <strong>Jornada de Superação</strong> exige <strong>100% das micro metas cumpridas</strong> para a certificação. Não deixe metas acumularem.</p>
      </div>
    </div>
  `,

  14: `
    <div class="space-y-5">
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-red-800 text-sm font-medium">🎯 Objetivo: Participar dos webinars e cases para enriquecer seu desenvolvimento.</p>
      </div>
      <div class="space-y-3 text-sm text-gray-700">
        <p>Os <strong>Webinars</strong> são eventos ao vivo com especialistas e líderes. Acesse o calendário no Portal do Aluno.</p>
        <ul class="space-y-1 list-disc list-inside">
          <li>Inscreva-se com antecedência</li>
          <li>Participe ao vivo — a presença é registrada automaticamente</li>
          <li>Cada webinar assistido conta para o indicador de <strong>Webinars</strong> no Engajamento</li>
        </ul>
        <p>Os <strong>Cases</strong> são estudos de caso reais. Ao final do macrociclo, você também entregará seu próprio Case de Sucesso — documentando um resultado real obtido com os aprendizados do programa.</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">⚠️ O <strong>Case de Sucesso</strong> é requisito para a certificação. Comece a documentar seus resultados desde o início do programa.</p>
      </div>
    </div>
  `,

  15: `
    <div class="space-y-5">
      <div class="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <p class="text-cyan-800 text-sm font-medium">🎯 Objetivo: Entender os 3 gráficos da página de Performance e saber o que é necessário para se certificar.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📊 Os 3 Indicadores da Performance</h3>

      <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p class="font-semibold text-blue-800">1. Engajamento (Meta: ≥ 80%)</p>
        <p class="text-sm text-gray-600 mt-1">Mede sua participação ativa no programa. É a média de 5 microindicadores:</p>
        <ul class="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
          <li><strong>Webinars</strong> — presença nos eventos ao vivo</li>
          <li><strong>Avaliações</strong> — média das notas nos quizzes</li>
          <li><strong>Competências</strong> — módulos concluídos na trilha</li>
          <li><strong>Tarefas</strong> — tarefas práticas entregues</li>
          <li><strong>Nota da Mentora</strong> — avaliação de engajamento por sessão</li>
        </ul>
      </div>

      <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <p class="font-semibold text-emerald-800">2. Jornada de Superação — Metas (Meta: 100%)</p>
        <p class="text-sm text-gray-600 mt-1">Mostra o percentual de <strong>micro metas cumpridas</strong> em relação ao total lançado pela mentora. Cumprir todas demonstra comprometimento com o desenvolvimento.</p>
      </div>

      <div class="bg-rose-50 rounded-xl p-4 border border-rose-100">
        <p class="font-semibold text-rose-800">3. Aplicabilidade Prática (Meta: ≥ 80%)</p>
        <p class="text-sm text-gray-600 mt-1">Mede o quanto você está aplicando o aprendizado na prática, com base em:</p>
        <ul class="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
          <li><strong>Micro Tarefas</strong> — sua autoavaliação e a nota da mentora por tarefa</li>
          <li><strong>Case de Sucesso</strong> — entregue ao final do macrociclo</li>
        </ul>
      </div>

      <div class="bg-[#0A1E3E] rounded-xl p-4 text-white">
        <p class="font-bold text-[#F5991F] text-sm mb-2">🏅 Requisitos para Certificação</p>
        <p class="text-xs text-white/80 mb-2">Para ser certificado, você precisa atingir, <strong>dentro do macrociclo</strong>, 80% nos três indicadores:</p>
        <ul class="space-y-1 text-sm text-white/90">
          <li>✅ Engajamento ≥ 80%</li>
          <li>✅ Jornada de Superação — 100% das metas cumpridas</li>
          <li>✅ Aplicabilidade Prática ≥ 80%</li>
          <li>✅ Case de Sucesso entregue e validado</li>
        </ul>
        <p class="text-xs text-white/60 mt-3">Acompanhe seu progresso em tempo real na aba <strong>Performance</strong>.</p>
      </div>
    </div>
  `,
};

// ============================================================
// DADOS DOS TUTORIAIS
// ============================================================

interface Tutorial {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  bloco: 1 | 2;
  icon: React.ElementType;
  thumbnailColor: string;
  ordem: number;
}

const TUTORIAIS: Tutorial[] = [
  // BLOCO 1 — Jornada de Onboarding
  { id: 1, titulo: "Navegando pela Plataforma", descricao: "Conheça o menu principal, as abas e entenda como o macrociclo organiza sua jornada.", categoria: "Onboarding", bloco: 1, icon: Map, thumbnailColor: "from-blue-500 to-blue-700", ordem: 1 },
  { id: 2, titulo: "Assessment Comportamental", descricao: "Entenda os testes que você deve realizar e como a mentora usará os resultados no primeiro encontro.", categoria: "Onboarding", bloco: 1, icon: ClipboardCheck, thumbnailColor: "from-purple-500 to-purple-700", ordem: 2 },
  { id: 3, titulo: "Escolhendo sua Mentora", descricao: "Saiba como analisar os perfis e escolher a mentora ideal para o seu desenvolvimento.", categoria: "Onboarding", bloco: 1, icon: User, thumbnailColor: "from-pink-500 to-pink-700", ordem: 3 },
  { id: 4, titulo: "Agendando sua Primeira Sessão", descricao: "Como verificar disponibilidade, escolher horário e acessar o link do Google Meet.", categoria: "Onboarding", bloco: 1, icon: CalendarDays, thumbnailColor: "from-green-500 to-green-700", ordem: 4 },
  { id: 5, titulo: "Sessão Inicial com sua Mentora", descricao: "O que esperar do primeiro encontro: Assessment, definição da trilha e próximos passos.", categoria: "Onboarding", bloco: 1, icon: Users2, thumbnailColor: "from-indigo-500 to-indigo-700", ordem: 5 },
  { id: 6, titulo: "Sua Jornada de Desenvolvimento", descricao: "Como funciona a trilha de competências, os ciclos mensais e o macrociclo.", categoria: "Onboarding", bloco: 1, icon: TrendingUp, thumbnailColor: "from-teal-500 to-teal-700", ordem: 6 },
  { id: 7, titulo: "Meu PDI — Plano de Desenvolvimento", descricao: "Entenda as metas macro e micro do seu PDI e como acompanhá-las na plataforma.", categoria: "Onboarding", bloco: 1, icon: Target, thumbnailColor: "from-orange-500 to-orange-700", ordem: 7 },
  { id: 8, titulo: "Aceite e Início da Jornada", descricao: "A última etapa do Onboarding: confirme seu compromisso e libere o acesso completo.", categoria: "Onboarding", bloco: 1, icon: Award, thumbnailColor: "from-rose-500 to-rose-700", ordem: 8 },
  // BLOCO 2 — Usando a Plataforma no Dia a Dia
  { id: 9, titulo: "Navegando pela Plataforma", descricao: "Explore as abas do dia a dia: Mural, Portal do Aluno, Performance e Evolução.", categoria: "Plataforma", bloco: 2, icon: BookOpen, thumbnailColor: "from-sky-500 to-sky-700", ordem: 9 },
  { id: 10, titulo: "Sessões de Mentoria", descricao: "Como acessar, se preparar e aproveitar ao máximo cada sessão quinzenal.", categoria: "Mentoria", bloco: 2, icon: Video, thumbnailColor: "from-violet-500 to-violet-700", ordem: 10 },
  { id: 11, titulo: "Trilha de Competências", descricao: "Como acompanhar e avançar nos módulos da sua trilha personalizada.", categoria: "Trilha", bloco: 2, icon: GraduationCap, thumbnailColor: "from-teal-500 to-teal-700", ordem: 11 },
  { id: 12, titulo: "Tarefas Práticas", descricao: "Como receber, executar, entregar e ter suas tarefas validadas pela mentora.", categoria: "Tarefas", bloco: 2, icon: FileText, thumbnailColor: "from-amber-500 to-amber-700", ordem: 12 },
  { id: 13, titulo: "Metas (Macro e Micro)", descricao: "Acompanhe e cumpra suas metas para alimentar o indicador Jornada de Superação.", categoria: "Metas", bloco: 2, icon: Target, thumbnailColor: "from-purple-500 to-purple-700", ordem: 13 },
  { id: 14, titulo: "Webinars e Cases", descricao: "Participe dos webinars ao vivo e entenda como preparar seu Case de Sucesso.", categoria: "Webinars", bloco: 2, icon: PlayCircle, thumbnailColor: "from-red-500 to-red-700", ordem: 14 },
  { id: 15, titulo: "Acompanhando sua Performance", descricao: "Os 3 gráficos da Performance explicados e os requisitos para a certificação.", categoria: "Performance", bloco: 2, icon: BarChart3, thumbnailColor: "from-cyan-500 to-cyan-700", ordem: 15 },
];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Tutoriais() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [tutoriaisLidos, setTutoriaisLidos] = useState<Set<number>>(new Set());
  const [tutorialAberto, setTutorialAberto] = useState<Tutorial | null>(null);

  const tutoriaisFiltrados = searchTerm
    ? TUTORIAIS.filter(t =>
        t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const bloco1 = TUTORIAIS.filter(t => t.bloco === 1);
  const bloco2 = TUTORIAIS.filter(t => t.bloco === 2);

  const totalLidos = tutoriaisLidos.size;
  const progressoPercent = Math.round((totalLidos / TUTORIAIS.length) * 100);

  const handleAbrir = (tutorial: Tutorial) => {
    setTutoriaisLidos(prev => { const next = new Set(prev); next.add(tutorial.id); return next; });
    setTutorialAberto(tutorial);
  };

  const renderCard = (tutorial: Tutorial) => {
    const isLido = tutoriaisLidos.has(tutorial.id);
    const Icon = tutorial.icon;
    return (
      <Card
        key={tutorial.id}
        className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${isLido ? "border-green-200 bg-green-50/30" : ""}`}
        onClick={() => handleAbrir(tutorial)}
      >
        <div className="flex">
          <div className={`w-24 shrink-0 bg-gradient-to-br ${tutorial.thumbnailColor} flex flex-col items-center justify-center text-white relative`}>
            <Icon className="h-7 w-7 mb-1" />
            <span className="text-[10px] font-bold">#{tutorial.ordem}</span>
            {isLido && <div className="absolute top-1.5 right-1.5"><CheckCircle2 className="h-4 w-4 text-white drop-shadow" /></div>}
          </div>
          <div className="flex-1 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tutorial.categoria}</Badge>
              {isLido && <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">Lido</Badge>}
            </div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{tutorial.titulo}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tutorial.descricao}</p>
            <Button
              size="sm"
              className={`mt-2 text-xs h-7 ${isLido ? "bg-green-600 hover:bg-green-700 text-white" : "bg-[#F5991F] hover:bg-[#d06a1e] text-white"}`}
              onClick={(e) => { e.stopPropagation(); handleAbrir(tutorial); }}
            >
              <BookMarked className="h-3.5 w-3.5 mr-1" />
              {isLido ? "Ler Novamente" : "Ler Guia"}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AlunoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-[#0A1E3E] to-[#2a5a8a] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-[#F5991F]" />
                Tutoriais da Plataforma
              </h1>
              <p className="mt-1 text-white/80">Aprenda a usar todas as funcionalidades do Ecossistema do BEM</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#F5991F]">{progressoPercent}%</div>
              <div className="text-sm text-white/70">{totalLidos}/{TUTORIAIS.length} lidos</div>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5991F] to-[#f59e0b] transition-all duration-500" style={{ width: `${progressoPercent}%` }} />
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar tutoriais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resultados de busca */}
        {tutoriaisFiltrados && (
          <div className="grid gap-4 md:grid-cols-2">
            {tutoriaisFiltrados.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-gray-400">Nenhum tutorial encontrado.</div>
            ) : tutoriaisFiltrados.map(renderCard)}
          </div>
        )}

        {/* Bloco 1 */}
        {!tutoriaisFiltrados && (
          <>
            <Card className="border-[#0A1E3E]/20 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#0A1E3E]" />
                  Bloco 1 — Jornada de Onboarding
                </CardTitle>
                <CardDescription>8 guias para completar sua entrada no programa passo a passo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {bloco1.map(renderCard)}
                </div>
              </CardContent>
            </Card>

            {/* Bloco 2 */}
            <Card className="border-[#F5991F]/20 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#F5991F]" />
                  Bloco 2 — Usando a Plataforma no Dia a Dia
                </CardTitle>
                <CardDescription>7 guias para aproveitar ao máximo cada funcionalidade da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {bloco2.map(renderCard)}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dica */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Recomendamos ler os tutoriais na ordem da jornada. Em caso de dúvidas, entre em contato com sua mentora ou com o suporte do programa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={!!tutorialAberto} onOpenChange={(open) => { if (!open) setTutorialAberto(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {tutorialAberto && (
            <>
              <DialogHeader>
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${tutorialAberto.thumbnailColor} mb-1`} />
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tutorialAberto.thumbnailColor} flex items-center justify-center shrink-0`}>
                    {(() => { const Icon = tutorialAberto.icon; return <Icon className="h-4 w-4 text-white" />; })()}
                  </div>
                  {tutorialAberto.titulo}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{tutorialAberto.categoria}</Badge>
                  <Badge variant="outline" className="text-[10px]">Tutorial #{tutorialAberto.ordem}</Badge>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Lido
                  </Badge>
                </div>
              </DialogHeader>
              <div
                className="mt-2 text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: CONTEUDO_TUTORIAIS[tutorialAberto.id] || "<p>Conteúdo em breve.</p>" }}
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setTutorialAberto(null)} className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white">
                  <X className="h-4 w-4 mr-1" /> Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AlunoLayout>
  );
}
