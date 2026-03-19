import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Users, CheckCircle2, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const STEP_LABELS = [
  'Convite Enviado',
  'Cadastro Preenchido',
  'Teste Realizado',
  'Mentoria Agendada',
  'PDI Publicado',
  'Termo Assinado',
] as const;

const STEP_KEYS = [
  'conviteEnviado',
  'cadastroPreenchido',
  'testeRealizado',
  'mentoriaAgendada',
  'pdiPublicado',
  'termoAssinado',
] as const;

type StepKey = typeof STEP_KEYS[number];

interface StudentTracking {
  alunoId: number;
  name: string | null;
  email: string | null;
  programName: string | null;
  turmaName: string | null;
  steps: Record<StepKey, boolean>;
  completedSteps: number;
  totalSteps: number;
  createdAt: unknown;
  cadastroConfirmadoEm: unknown;
  aceiteRealizadoEm: unknown;
}

function ProgressBar({ steps, completedSteps }: { steps: Record<StepKey, boolean>; completedSteps: number }) {
  const percentage = Math.round((completedSteps / 6) * 100);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: percentage === 100
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #f59e0b, #e8a838)',
            }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-start justify-between gap-1">
        {STEP_LABELS.map((label, i) => {
          const key = STEP_KEYS[i];
          const isCompleted = steps[key];

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 text-center leading-tight line-clamp-2 ${
                      isCompleted ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                    }`}>
                      {label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCompleted ? 'Concluído' : 'Pendente'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

function StudentRow({ student, isExpanded, onToggle }: { student: StudentTracking; isExpanded: boolean; onToggle: () => void }) {
  const percentage = Math.round((student.completedSteps / student.totalSteps) * 100);
  const isComplete = student.completedSteps === student.totalSteps;

  return (
    <div className={`border rounded-lg transition-all duration-200 ${isComplete ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-border bg-card'}`}>
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{student.name || 'Sem nome'}</p>
            <Badge variant={isComplete ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 shrink-0 ${isComplete ? 'bg-emerald-500' : ''}`}>
              {percentage}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{student.email || '—'}</p>
        </div>

        {/* Program/Turma */}
        <div className="hidden md:block text-xs text-muted-foreground min-w-[120px]">
          {student.programName && <p className="truncate">{student.programName}</p>}
          {student.turmaName && <p className="truncate text-[10px]">{student.turmaName}</p>}
        </div>

        {/* Step count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          <span>{student.completedSteps}/{student.totalSteps}</span>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded progress bar */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <ProgressBar steps={student.steps} completedSteps={student.completedSteps} />
        </div>
      )}
    </div>
  );
}

export default function OnboardingTracking() {
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: students = [], isLoading } = trpc.onboardingTracking.list.useQuery();
  const { data: programsList = [] } = trpc.programs.list.useQuery();

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredStudents.map(s => s.alunoId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredStudents = useMemo(() => {
    let result = students as StudentTracking[];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }

    // Program filter
    if (programFilter !== 'all') {
      result = result.filter(s => s.programName === programFilter);
    }

    // Status filter
    if (statusFilter === 'complete') {
      result = result.filter(s => s.completedSteps === s.totalSteps);
    } else if (statusFilter === 'in_progress') {
      result = result.filter(s => s.completedSteps > 0 && s.completedSteps < s.totalSteps);
    } else if (statusFilter === 'not_started') {
      result = result.filter(s => s.completedSteps <= 1); // Only invite sent
    }

    // Sort: in progress first, then by completion
    result.sort((a, b) => {
      if (a.completedSteps === a.totalSteps && b.completedSteps !== b.totalSteps) return 1;
      if (a.completedSteps !== a.totalSteps && b.completedSteps === b.totalSteps) return -1;
      return b.completedSteps - a.completedSteps;
    });

    return result;
  }, [students, search, programFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const all = students as StudentTracking[];
    return {
      total: all.length,
      complete: all.filter(s => s.completedSteps === s.totalSteps).length,
      inProgress: all.filter(s => s.completedSteps > 1 && s.completedSteps < s.totalSteps).length,
      notStarted: all.filter(s => s.completedSteps <= 1).length,
    };
  }, [students]);

  // Unique programs for filter
  const uniquePrograms = useMemo(() => {
    const progs = new Set<string>();
    (students as StudentTracking[]).forEach(s => {
      if (s.programName) progs.add(s.programName);
    });
    return Array.from(progs).sort();
  }, [students]);

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Acompanhamento de Onboarding</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe o progresso de cada aluno nas etapas do onboarding
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('complete')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.complete}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('not_started')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <Filter className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{stats.notStarted}</p>
                <p className="text-xs text-muted-foreground">Não Iniciados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Programas</SelectItem>
                {uniquePrograms.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="complete">Concluídos</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="not_started">Não Iniciados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Alunos ({filteredStudents.length})
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-xs text-primary hover:underline"
              >
                Expandir Todos
              </button>
              <span className="text-xs text-muted-foreground">|</span>
              <button
                onClick={collapseAll}
                className="text-xs text-primary hover:underline"
              >
                Recolher Todos
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm">Ajuste os filtros ou adicione novos alunos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map(student => (
                <StudentRow
                  key={student.alunoId}
                  student={student}
                  isExpanded={expandedIds.has(student.alunoId)}
                  onToggle={() => toggleExpanded(student.alunoId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legenda das Etapas:</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
