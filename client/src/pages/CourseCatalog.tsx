import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Play, Lock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Module {
  id: number;
  tipo: string;
  titulo: string;
  descricao?: string;
  urlThumbnail?: string;
  duracaoMinutos?: number;
  status: "nao_iniciado" | "em_progresso" | "concluido";
  statusSemaforo: "verde" | "amarelo" | "vermelho";
  diasRestantes?: number;
  nota?: number;
}

interface Competencia {
  competenciaId: number;
  competenciaNome: string;
  progresso: string;
  statusGeral: "nao_iniciado" | "em_progresso" | "concluido";
  modulos: Module[];
}

export function CourseCatalog() {
  const { user } = useAuth();
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // TODO: Obter alunoId e microcicloId do contexto do usuário
  const alunoId = user?.alunoId || 0;
  const microcicloId = 1; // TODO: Obter do contexto

  const { data: catalog, isLoading, isError } = trpc.course.getCatalog.useQuery(
    { alunoId, microcicloId },
    { enabled: !!alunoId }
  );

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Você precisa estar autenticado para acessar os cursos.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !catalog) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar catálogo de cursos.</AlertDescription>
      </Alert>
    );
  }

  const getSemaforoColor = (status: string) => {
    switch (status) {
      case "verde":
        return "bg-green-100 text-green-800 border-green-300";
      case "amarelo":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "vermelho":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSemaforoIcon = (status: string) => {
    switch (status) {
      case "verde":
        return "🟢";
      case "amarelo":
        return "🟡";
      case "vermelho":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getModuleIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "em_progresso":
        return <Play className="w-5 h-5 text-blue-600" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getModuleTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      intro: "Introdução",
      filme: "Filme",
      video: "Vídeo",
      tedtalk: "TED Talk",
      podcast: "Podcast",
      livro: "Livro",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Área de Cursos</h1>
          <p className="text-slate-400">Desenvolva suas competências através de conteúdo interativo</p>
        </div>

        {/* Competências Grid */}
        <div className="space-y-8">
          {catalog.map((competencia: Competencia) => (
            <div key={competencia.competenciaId} className="space-y-4">
              {/* Competência Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${getSemaforoIcon(
                    competencia.modulos[0]?.statusSemaforo || "verde"
                  )}`}></span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{competencia.competenciaNome}</h2>
                    <p className="text-slate-400 text-sm">
                      Progresso: <span className="font-semibold text-blue-400">{competencia.progresso}</span> módulos
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-2 ${
                    competencia.statusGeral === "concluido"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : competencia.statusGeral === "em_progresso"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  {competencia.statusGeral === "concluido"
                    ? "✓ Concluída"
                    : competencia.statusGeral === "em_progresso"
                      ? "⏳ Em Progresso"
                      : "🔒 Não Iniciada"}
                </Badge>
              </div>

              {/* Módulos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competencia.modulos.map((modulo: Module) => (
                  <Card
                    key={modulo.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      modulo.status === "concluido"
                        ? "border-green-300 bg-green-50"
                        : modulo.status === "em_progresso"
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-300 bg-white"
                    }`}
                    onClick={() => setSelectedModule(modulo)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{modulo.titulo}</CardTitle>
                          <CardDescription className="text-sm">
                            {getModuleTypeLabel(modulo.tipo)}
                          </CardDescription>
                        </div>
                        {getModuleIcon(modulo.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Duração */}
                      {modulo.duracaoMinutos && (
                        <div className="text-sm text-slate-600">
                          ⏱️ {modulo.duracaoMinutos} minutos
                        </div>
                      )}

                      {/* Status Semáforo */}
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSemaforoColor(modulo.statusSemaforo)}`}>
                        {modulo.statusSemaforo === "verde"
                          ? `🟢 ${modulo.diasRestantes || "Sem prazo"} dias`
                          : modulo.statusSemaforo === "amarelo"
                            ? `🟡 ${modulo.diasRestantes} dias restantes`
                            : `🔴 Expirado`}
                      </div>

                      {/* Nota se concluído */}
                      {modulo.status === "concluido" && modulo.nota !== undefined && (
                        <div className="text-sm font-semibold text-green-700">
                          ✓ Nota: {modulo.nota.toFixed(1)}/10
                        </div>
                      )}

                      {/* Botão de Ação */}
                      <Button
                        className="w-full mt-2"
                        variant={modulo.status === "nao_iniciado" ? "default" : "outline"}
                        disabled={modulo.statusSemaforo === "vermelho"}
                      >
                        {modulo.status === "concluido"
                          ? "✓ Concluído"
                          : modulo.status === "em_progresso"
                            ? "⏳ Continuar"
                            : modulo.statusSemaforo === "vermelho"
                              ? "🔴 Expirado"
                              : "▶ Iniciar"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {catalog.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Nenhum curso disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
