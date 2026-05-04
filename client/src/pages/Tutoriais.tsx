import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Search, Clock, CheckCircle2,
  User, CalendarDays, ClipboardCheck, Users2, Video,
  Target, BarChart3, FileText, GraduationCap, Sparkles,
  ChevronRight, BookMarked, X, PlayCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ============================================================
// CONTEÚDO HTML DOS TUTORIAIS
// ============================================================

const CONTEUDO_TUTORIAIS: Record<number, string> = {
  1: `
    <div class="space-y-5">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p class="text-blue-800 text-sm font-medium">🎯 Objetivo: Conhecer as seções da plataforma e entender como está organizada a sua jornada de desenvolvimento.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800 flex items-center gap-2">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Explore o Menu Principal</p>
            <p class="text-sm text-gray-600 mt-1">Familiarize-se com as abas no topo da tela:</p>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li>📌 <strong>Onboarding</strong> — sua trilha de entrada no programa</li>
              <li>📌 <strong>Mural</strong> — comunicados e novidades do programa</li>
              <li>📌 <strong>Portal do Aluno</strong> — seu hub central (tarefas, metas, sessões)</li>
              <li>📌 <strong>Performance</strong> — seus indicadores e resultados</li>
              <li>📌 <strong>Evolução</strong> — sua trilha de competências e ciclos</li>
            </ul>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Entenda o Macrociclo</p>
            <p class="text-sm text-gray-600 mt-1">O programa é estruturado em um <strong>macrociclo</strong> — o período total do seu contrato de mentoria. Dentro dele, existem <strong>ciclos menores</strong> (geralmente mensais), cada um focado em competências específicas. Toda a sua jornada de desenvolvimento acontece dentro desse macrociclo.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Fique Atento às Notificações</p>
            <p class="text-sm text-gray-600 mt-1">O sistema enviará e-mails automáticos para lembretes de sessões, tarefas pendentes e webinars. Mantenha seu e-mail atualizado no perfil.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
        <p class="text-amber-800 text-sm">💡 <strong>Dica:</strong> Comece pelo Onboarding assim que fizer login. Ele foi desenhado para te guiar passo a passo nas primeiras etapas do programa.</p>
      </div>
    </div>
  `,

  2: `
    <div class="space-y-5">
      <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p class="text-purple-800 text-sm font-medium">🎯 Objetivo: Entender o que é o Assessment comportamental, como ele acontece e qual é o seu papel nesse processo.</p>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p class="text-blue-800 text-sm">ℹ️ <strong>Importante:</strong> O Assessment <strong>não é preenchido por você</strong> diretamente. Ele é conduzido pela sua mentora durante a primeira sessão de mentoria (Sessão 1 — Assessment). Sua participação é fundamental: você responde às perguntas com honestidade e a mentora registra o resultado no sistema.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Como acontece na prática</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Aguarde o Agendamento da Sessão 1</p>
            <p class="text-sm text-gray-600 mt-1">Após concluir seu cadastro no Onboarding e escolher sua mentora, a primeira sessão será agendada. Você receberá o link do Google Meet por e-mail e também poderá acessá-lo diretamente pela aba <strong>Onboarding</strong>.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Participe da Sessão com Presença e Abertura</p>
            <p class="text-sm text-gray-600 mt-1">Durante a reunião, sua mentora conduzirá uma conversa estruturada para mapear seu perfil comportamental. Responda com <strong>sinceridade</strong> — não existe resposta certa ou errada. O objetivo é entender como você realmente age no ambiente profissional.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Sua Mentora Registra o Resultado</p>
            <p class="text-sm text-gray-600 mt-1">Após a sessão, sua mentora lança o resultado do Assessment na plataforma. Isso inclui seu <strong>perfil comportamental</strong>, as competências prioritárias identificadas e o relatório da sessão — que ficará disponível para você na aba Onboarding.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Sua Trilha é Definida</p>
            <p class="text-sm text-gray-600 mt-1">Com base no Assessment, sua mentora define a <strong>trilha de competências</strong> que você seguirá ao longo do macrociclo, as metas de desenvolvimento e o foco de cada ciclo mensal.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Por que isso importa?</strong> O Assessment é o ponto de partida de tudo. Ele define quais competências serão trabalhadas, quais metas serão lançadas e qual trilha de desenvolvimento você seguirá ao longo do programa. Quanto mais honesto você for na sessão, mais personalizado e eficaz será seu desenvolvimento.</p>
      </div>
    </div>
  `,

  3: `
    <div class="space-y-5">
      <div class="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p class="text-pink-800 text-sm font-medium">🎯 Objetivo: Escolher a mentora ideal para guiar seu desenvolvimento durante todo o macrociclo.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse a Etapa de Escolha</p>
            <p class="text-sm text-gray-600 mt-1">Após concluir o Assessment, a etapa de escolha da mentora será liberada no seu <strong>Onboarding</strong>. Clique nela para visualizar as mentoras disponíveis.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Analise os Perfis com Calma</p>
            <p class="text-sm text-gray-600 mt-1">Leia a minibiografia, as especialidades e a experiência de cada mentora. Observe em quais competências ela tem maior expertise — como <em>Liderança</em>, <em>Comunicação</em>, <em>Inteligência Emocional</em> ou <em>Visão Estratégica</em>.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Busque Alinhamento com seu Perfil</p>
            <p class="text-sm text-gray-600 mt-1">Considere as competências que o seu Assessment apontou como prioridade. Escolha uma mentora cuja trajetória e especialidades se conectem com as áreas que você precisa desenvolver.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Confirme sua Escolha</p>
            <p class="text-sm text-gray-600 mt-1">Clique em <strong>"Selecionar Mentora"</strong> e confirme. A partir desse momento, ela será sua guia durante todo o macrociclo — responsável por lançar suas metas, validar suas tarefas e acompanhar sua evolução.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Importante:</strong> A escolha da mentora é uma decisão importante. Ela será sua parceira de desenvolvimento por todo o macrociclo. Leve o tempo necessário para decidir com consciência.</p>
      </div>
    </div>
  `,

  4: `
    <div class="space-y-5">
      <div class="bg-green-50 border border-green-200 rounded-xl p-4">
        <p class="text-green-800 text-sm font-medium">🎯 Objetivo: Agendar suas sessões quinzenais de mentoria e garantir que nenhum encontro seja perdido.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse o Card de Mentorias</p>
            <p class="text-sm text-gray-600 mt-1">No <strong>Portal do Aluno</strong>, clique no card <strong>"Mentorias"</strong>. Você verá o histórico de sessões e o botão para agendar a próxima.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Verifique a Disponibilidade</p>
            <p class="text-sm text-gray-600 mt-1">Sua mentora disponibilizará horários na agenda. Escolha o dia e horário que melhor se encaixam na sua rotina profissional.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Confirme o Agendamento</p>
            <p class="text-sm text-gray-600 mt-1">Após confirmar, você receberá um <strong>e-mail com o link do Google Meet</strong>. O link também ficará visível no seu painel, na sessão correspondente.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Respeite a Frequência Quinzenal</p>
            <p class="text-sm text-gray-600 mt-1">O programa prevê sessões <strong>a cada 15 dias</strong>. A regularidade dos encontros é fundamental para manter o ritmo do desenvolvimento e garantir que você atinja a <strong>meta de 80% de engajamento</strong> necessária para a certificação.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Atenção:</strong> Sessões não realizadas impactam diretamente o seu indicador de Engajamento. Em caso de imprevisto, comunique sua mentora com antecedência para reagendar.</p>
      </div>
    </div>
  `,

  5: `
    <div class="space-y-5">
      <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <p class="text-teal-800 text-sm font-medium">🎯 Objetivo: Aproveitar ao máximo cada sessão de mentoria para acelerar seu desenvolvimento.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Prepare-se com Antecedência</p>
            <p class="text-sm text-gray-600 mt-1">Antes da sessão, revise as tarefas combinadas na sessão anterior. Anote situações reais do seu dia a dia que deseja discutir, dúvidas sobre as metas e reflexões sobre seu desenvolvimento.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse o Link no Horário</p>
            <p class="text-sm text-gray-600 mt-1">No horário marcado, acesse o <strong>Portal do Aluno</strong> e clique em <strong>"Acessar Sessão"</strong> para abrir o Google Meet. Garanta boa conexão de internet, câmera ligada e um ambiente silencioso.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Seja Ativo e Aberto</p>
            <p class="text-sm text-gray-600 mt-1">Compartilhe suas experiências com honestidade. Quanto mais você se abrir sobre desafios reais, mais direcionada e valiosa será a orientação da sua mentora. As sessões são um espaço seguro de desenvolvimento.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Registre os Aprendizados e Novas Tarefas</p>
            <p class="text-sm text-gray-600 mt-1">Ao final da sessão, sua mentora registrará no sistema as tarefas combinadas e sua nota de engajamento. Você também poderá registrar sua autoavaliação de <strong>aplicabilidade</strong> — o quanto está conseguindo aplicar o aprendizado na prática.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Lembre-se:</strong> A nota de engajamento dada pela sua mentora em cada sessão compõe um dos 5 indicadores do seu painel de Performance. Sessões bem aproveitadas refletem diretamente nos seus resultados.</p>
      </div>
    </div>
  `,

  6: `
    <div class="space-y-5">
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p class="text-orange-800 text-sm font-medium">🎯 Objetivo: Entender como funciona sua trilha de competências, os ciclos de desenvolvimento e como acompanhar seu progresso.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Entenda o Macrociclo e os Ciclos</p>
            <p class="text-sm text-gray-600 mt-1">Seu programa é organizado em um <strong>macrociclo</strong> (o período total do contrato). Dentro dele, existem <strong>ciclos menores</strong> (geralmente mensais), cada um focado em um conjunto de competências específicas definidas pela sua mentora com base no seu Assessment.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse a Aba Evolução</p>
            <p class="text-sm text-gray-600 mt-1">Clique em <strong>Evolução</strong> no menu. Você verá sua trilha (ex: <em>Trilha Basic</em>, <em>Advanced</em>) e o gráfico de radar que mostra seu nível atual em cada competência versus a meta esperada.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Acompanhe as Metas Macro e Micro</p>
            <p class="text-sm text-gray-600 mt-1">Sua mentora lança uma <strong>Meta Macro</strong> (o objetivo principal do ciclo) e até 5 <strong>Micro Metas</strong> (ações concretas que levam ao atingimento da meta macro). Você pode acompanhar o progresso de cada uma no card <strong>"Metas"</strong> do Portal do Aluno.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Cumpra as Metas para Evoluir</p>
            <p class="text-sm text-gray-600 mt-1">Cada micro meta cumprida contribui para o indicador de <strong>Jornada de Superação</strong> no seu painel de Performance. Atingir <strong>80% ou mais</strong> das metas ao longo do macrociclo é um dos requisitos para a certificação.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Dica:</strong> Revise suas metas antes de cada sessão. Isso demonstra comprometimento para sua mentora e garante que o tempo da sessão seja usado para avançar, não apenas para revisar o que ficou pendente.</p>
      </div>
    </div>
  `,

  7: `
    <div class="space-y-5">
      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p class="text-indigo-800 text-sm font-medium">🎯 Objetivo: Acessar e concluir os cursos e módulos da sua trilha de desenvolvimento.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse o Card de Aulas</p>
            <p class="text-sm text-gray-600 mt-1">No <strong>Portal do Aluno</strong>, clique no card <strong>"Aulas / Competências"</strong>. Você será direcionado para a plataforma de cursos da sua trilha.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Siga a Ordem da Trilha</p>
            <p class="text-sm text-gray-600 mt-1">Os módulos estão organizados em sequência lógica. Respeite a ordem para que o aprendizado seja progressivo e consistente com as competências trabalhadas em cada ciclo.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Complete as Atividades</p>
            <p class="text-sm text-gray-600 mt-1">Assista às videoaulas, leia os materiais complementares e realize os quizzes ou avaliações ao final de cada módulo. A nota obtida nas avaliações compõe o indicador de <strong>Avaliações</strong> no seu painel de Performance.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Acompanhe seu Progresso</p>
            <p class="text-sm text-gray-600 mt-1">O percentual de conclusão dos cursos é refletido no indicador de <strong>Competências</strong> do seu painel. Concluir os módulos do ciclo atual é essencial para atingir a <strong>meta de 80% de engajamento</strong> e avançar para a certificação.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Dica:</strong> Conecte o conteúdo dos cursos com as situações reais do seu trabalho. Isso facilita a aplicação prática e enriquece as conversas nas sessões de mentoria.</p>
      </div>
    </div>
  `,

  8: `
    <div class="space-y-5">
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-red-800 text-sm font-medium">🎯 Objetivo: Participar dos webinars ao vivo e aproveitar as gravações para enriquecer seu desenvolvimento.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Verifique a Agenda de Webinars</p>
            <p class="text-sm text-gray-600 mt-1">No <strong>Portal do Aluno</strong>, acesse o card <strong>"Eventos / Webinars"</strong>. Você verá os próximos eventos programados para o seu macrociclo — geralmente <strong>2 webinars quinzenais</strong> por período.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Confirme sua Participação</p>
            <p class="text-sm text-gray-600 mt-1">Clique no evento e confirme presença. Você receberá um lembrete por e-mail próximo à data.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Participe ao Vivo</p>
            <p class="text-sm text-gray-600 mt-1">A <strong>presença ao vivo é contabilizada</strong> no indicador de Webinars do seu painel de Performance. Participe ativamente: faça perguntas, interaja no chat e anote os principais aprendizados.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Acesse as Gravações</p>
            <p class="text-sm text-gray-600 mt-1">Não conseguiu participar ao vivo? As gravações ficam disponíveis na plataforma. Porém, lembre-se: <strong>apenas a presença ao vivo conta para o indicador de Engajamento</strong>. Assistir à gravação é um complemento, não um substituto.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Atenção:</strong> Os webinars são parte do cálculo do seu Engajamento. Para atingir a <strong>meta de 80%</strong> e se certificar, é essencial participar da maior parte dos eventos do seu macrociclo.</p>
      </div>
    </div>
  `,

  9: `
    <div class="space-y-5">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm font-medium">🎯 Objetivo: Receber, executar e entregar as tarefas práticas atribuídas pela mentora, aplicando o conhecimento no seu dia a dia.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Passo a Passo</h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p class="font-semibold text-gray-800">Receba a Tarefa</p>
            <p class="text-sm text-gray-600 mt-1">Após cada sessão de mentoria, sua mentora atribuirá uma <strong>tarefa prática</strong> no sistema. Você receberá uma notificação por e-mail. Acesse o card <strong>"Tarefas / Entregas"</strong> no Portal do Aluno para ver os detalhes e o prazo.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p class="font-semibold text-gray-800">Execute no Ambiente Real</p>
            <p class="text-sm text-gray-600 mt-1">As tarefas são desenhadas para serem aplicadas no seu trabalho. Execute a atividade com atenção, observe os resultados e reflita sobre o que funcionou e o que pode ser melhorado.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p class="font-semibold text-gray-800">Envie sua Entrega</p>
            <p class="text-sm text-gray-600 mt-1">Volte ao sistema, clique na tarefa e escreva um relato da sua experiência: o que fez, como foi, o que aprendeu. Você também pode anexar arquivos como evidência. Clique em <strong>"Enviar para Validação"</strong>.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-[#0A1E3E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
          <div>
            <p class="font-semibold text-gray-800">Aguarde a Validação e Avalie sua Aplicabilidade</p>
            <p class="text-sm text-gray-600 mt-1">Sua mentora revisará a entrega e dará um feedback. Você também será convidado a registrar sua <strong>nota de aplicabilidade</strong> — o quanto conseguiu aplicar o aprendizado na prática. Essa nota compõe o indicador de <strong>Aplicabilidade Prática</strong> no seu painel.</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-amber-800 text-sm">💡 <strong>Importante:</strong> As tarefas entregues compõem o indicador de <strong>Tarefas</strong> no seu Engajamento. Entregar todas as tarefas dentro do prazo é fundamental para atingir a meta de 80% e garantir sua certificação.</p>
      </div>
    </div>
  `,

  10: `
    <div class="space-y-5">
      <div class="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <p class="text-cyan-800 text-sm font-medium">🎯 Objetivo: Entender seus indicadores de performance, acompanhar sua evolução e saber o que é necessário para se certificar.</p>
      </div>

      <h3 class="text-base font-bold text-gray-800">📋 Os 3 Grandes Indicadores</h3>

      <div class="space-y-4">
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p class="font-semibold text-blue-800">📊 1. Engajamento (Meta: 80%)</p>
          <p class="text-sm text-gray-600 mt-1">É a média dos 5 microindicadores:</p>
          <ul class="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Webinars</strong> — presença nos eventos ao vivo</li>
            <li>• <strong>Avaliações</strong> — média das notas nos quizzes e provas</li>
            <li>• <strong>Competências</strong> — módulos concluídos na trilha</li>
            <li>• <strong>Tarefas</strong> — tarefas práticas entregues</li>
            <li>• <strong>Nota da Mentora</strong> — avaliação de engajamento por sessão</li>
          </ul>
          <p class="text-sm text-blue-700 mt-2 font-medium">Atingir 80% neste indicador é requisito para a certificação.</p>
        </div>

        <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p class="font-semibold text-emerald-800">🏆 2. Jornada de Superação — Metas (Meta: 100%)</p>
          <p class="text-sm text-gray-600 mt-1">Mostra o percentual de <strong>micro metas cumpridas</strong> em relação ao total lançado pela mentora. Cada meta macro tem até 5 micro metas associadas. Cumprir todas demonstra comprometimento com o desenvolvimento.</p>
        </div>

        <div class="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p class="font-semibold text-rose-800">🎯 3. Aplicabilidade Prática (Meta: 80%)</p>
          <p class="text-sm text-gray-600 mt-1">Calculado separadamente do Engajamento. Mede o quanto você está aplicando o aprendizado na prática, com base em:</p>
          <ul class="mt-2 space-y-1 text-sm text-gray-600">
            <li>• <strong>Micro Tarefas</strong> — sua autoavaliação e a nota da mentora por tarefa</li>
            <li>• <strong>Case de Sucesso</strong> — ao final do macrociclo, você entrega um Case documentando um resultado real que obteve com os aprendizados do programa</li>
          </ul>
        </div>
      </div>

      <div class="bg-[#0A1E3E] rounded-xl p-4 text-white">
        <p class="font-bold text-[#F5991F] text-sm mb-2">🏅 Requisitos para Certificação</p>
        <ul class="space-y-1 text-sm text-white/90">
          <li>✅ Engajamento ≥ 80%</li>
          <li>✅ Aplicabilidade Prática ≥ 80%</li>
          <li>✅ Case de Sucesso entregue e validado</li>
          <li>✅ Todas as etapas do Onboarding concluídas</li>
        </ul>
        <p class="text-xs text-white/70 mt-3">Acompanhe seu progresso em tempo real na aba <strong>Performance</strong>.</p>
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
  icon: React.ElementType;
  thumbnailColor: string;
  lido: boolean;
  ordem: number;
}

const TUTORIAIS: Tutorial[] = [
  {
    id: 1,
    titulo: "Primeiros Passos na Plataforma",
    descricao: "Aprenda a navegar pela plataforma, atualizar seu perfil e entender as principais funcionalidades disponíveis para você.",
    categoria: "Início",
    icon: User,
    thumbnailColor: "from-blue-500 to-blue-700",
    lido: false,
    ordem: 1,
  },
  {
    id: 2,
    titulo: "Como Realizar o Assessment",
    descricao: "Entenda o que é o assessment, como acessar a avaliação de perfil comportamental e o que esperar dos resultados.",
    categoria: "Assessment",
    icon: ClipboardCheck,
    thumbnailColor: "from-purple-500 to-purple-700",
    lido: false,
    ordem: 2,
  },
  {
    id: 3,
    titulo: "Escolhendo sua Mentora",
    descricao: "Saiba como visualizar os perfis das mentoras disponíveis, analisar especialidades e fazer a melhor escolha para seu desenvolvimento.",
    categoria: "Mentoria",
    icon: Users2,
    thumbnailColor: "from-pink-500 to-pink-700",
    lido: false,
    ordem: 3,
  },
  {
    id: 4,
    titulo: "Agendando Sessões de Mentoria",
    descricao: "Aprenda a verificar a disponibilidade da sua mentora, escolher horários e acessar o link do Google Meet para as sessões.",
    categoria: "Mentoria",
    icon: CalendarDays,
    thumbnailColor: "from-green-500 to-green-700",
    lido: false,
    ordem: 4,
  },
  {
    id: 5,
    titulo: "Participando da Sessão de Mentoria",
    descricao: "Dicas para aproveitar ao máximo suas sessões: como se preparar, o que levar e como interagir com sua mentora.",
    categoria: "Mentoria",
    icon: Video,
    thumbnailColor: "from-teal-500 to-teal-700",
    lido: false,
    ordem: 5,
  },
  {
    id: 6,
    titulo: "Entendendo sua Trilha de Competências",
    descricao: "Veja como funciona a trilha de desenvolvimento, os ciclos, as metas macro e micro, e como acompanhar seu progresso.",
    categoria: "Trilha",
    icon: Target,
    thumbnailColor: "from-orange-500 to-orange-700",
    lido: false,
    ordem: 6,
  },
  {
    id: 7,
    titulo: "Acessando Cursos e Módulos",
    descricao: "Como acessar a plataforma de cursos, acompanhar seu progresso nos módulos e completar as atividades obrigatórias.",
    categoria: "Cursos",
    icon: GraduationCap,
    thumbnailColor: "from-indigo-500 to-indigo-700",
    lido: false,
    ordem: 7,
  },
  {
    id: 8,
    titulo: "Participando dos Webinars",
    descricao: "Saiba como se inscrever nos webinars, participar ao vivo e entender como a presença impacta seu Engajamento.",
    categoria: "Webinars",
    icon: PlayCircle,
    thumbnailColor: "from-red-500 to-red-700",
    lido: false,
    ordem: 8,
  },
  {
    id: 9,
    titulo: "Realizando Tarefas Práticas",
    descricao: "Entenda como receber, executar, entregar e avaliar suas tarefas práticas atribuídas pela mentora.",
    categoria: "Tarefas",
    icon: FileText,
    thumbnailColor: "from-amber-500 to-amber-700",
    lido: false,
    ordem: 9,
  },
  {
    id: 10,
    titulo: "Acompanhando sua Performance",
    descricao: "Aprenda a ler seus indicadores, entender os requisitos de certificação e acompanhar sua evolução ao longo do macrociclo.",
    categoria: "Performance",
    icon: BarChart3,
    thumbnailColor: "from-cyan-500 to-cyan-700",
    lido: false,
    ordem: 10,
  },
];

const CATEGORIAS = ["Todos", "Início", "Assessment", "Mentoria", "Trilha", "Cursos", "Webinars", "Tarefas", "Performance"];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Tutoriais() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [tutoriaisLidos, setTutoriaisLidos] = useState<Set<number>>(new Set());
  const [tutorialAberto, setTutorialAberto] = useState<Tutorial | null>(null);

  const tutoriaisFiltrados = TUTORIAIS.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaAtiva === "Todos" || t.categoria === categoriaAtiva;
    return matchSearch && matchCategoria;
  });

  const totalLidos = tutoriaisLidos.size;
  const totalTutoriais = TUTORIAIS.length;
  const progressoPercent = Math.round((totalLidos / totalTutoriais) * 100);

  const handleAbrir = (tutorial: Tutorial) => {
    setTutoriaisLidos(prev => {
      const next = new Set(prev);
      next.add(tutorial.id);
      return next;
    });
    setTutorialAberto(tutorial);
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
              <p className="mt-1 text-white/80">
                Aprenda a usar todas as funcionalidades do Ecossistema do BEM
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#F5991F]">{progressoPercent}%</div>
              <div className="text-sm text-white/70">{totalLidos}/{totalTutoriais} lidos</div>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F5991F] to-[#f59e0b] transition-all duration-500"
              style={{ width: `${progressoPercent}%` }}
            />
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tutoriais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(cat => (
              <Button
                key={cat}
                variant={categoriaAtiva === cat ? "default" : "outline"}
                size="sm"
                className={categoriaAtiva === cat
                  ? "bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                  : "text-gray-600 hover:text-[#0A1E3E]"
                }
                onClick={() => setCategoriaAtiva(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Jornada Recomendada */}
        {categoriaAtiva === "Todos" && !searchTerm && (
          <Card className="border-[#F5991F]/20 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#F5991F]" />
                Jornada Recomendada
              </CardTitle>
              <CardDescription>
                Leia os tutoriais na ordem para aproveitar melhor a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {TUTORIAIS.slice(0, 5).map((t, i) => {
                  const isLido = tutoriaisLidos.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-2">
                      <div className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                        ${isLido ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                      `}>
                        {isLido ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px]">
                            {t.ordem}
                          </span>
                        )}
                        {t.titulo.split(" ").slice(0, 3).join(" ")}
                      </div>
                      {i < 4 && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Tutoriais */}
        <div className="grid gap-4 md:grid-cols-2">
          {tutoriaisFiltrados.map(tutorial => {
            const isLido = tutoriaisLidos.has(tutorial.id);
            const TutorialIcon = tutorial.icon;

            return (
              <Card
                key={tutorial.id}
                className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  isLido ? "border-green-200 bg-green-50/30" : ""
                }`}
                onClick={() => handleAbrir(tutorial)}
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className={`
                    w-28 shrink-0 bg-gradient-to-br ${tutorial.thumbnailColor}
                    flex flex-col items-center justify-center text-white relative
                  `}>
                    <TutorialIcon className="h-8 w-8 mb-1" />
                    <div className="flex items-center gap-1 text-xs">
                      <BookMarked className="h-3 w-3" />
                      <span>Guia</span>
                    </div>
                    {isLido && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {tutorial.categoria}
                      </Badge>
                      <span className="text-[10px] text-gray-400">#{tutorial.ordem}</span>
                      {isLido && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                          Lido
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                      {tutorial.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {tutorial.descricao}
                    </p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className={isLido
                          ? "bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                          : "bg-[#F5991F] hover:bg-[#d06a1e] text-white text-xs h-7"
                        }
                        onClick={(e) => { e.stopPropagation(); handleAbrir(tutorial); }}
                      >
                        <BookMarked className="h-3.5 w-3.5 mr-1" />
                        {isLido ? "Ler Novamente" : "Ler Passo a Passo"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {tutoriaisFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600">Nenhum tutorial encontrado</h3>
            <p className="text-sm text-gray-400 mt-1">Tente buscar com outros termos ou altere o filtro</p>
          </div>
        )}

        {/* Dica */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Dica</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Recomendamos ler os tutoriais na ordem da jornada para entender melhor cada etapa do programa.
                  Em caso de dúvidas, entre em contato com sua mentora ou com o suporte do programa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Conteúdo */}
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
                <Button
                  onClick={() => setTutorialAberto(null)}
                  className="bg-[#0A1E3E] hover:bg-[#0A1E3E]/90 text-white"
                >
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
