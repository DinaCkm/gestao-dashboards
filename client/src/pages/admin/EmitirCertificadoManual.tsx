import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  fechamento: "Em fechamento",
  ajustes: "Em ajustes",
  encerrado: "Encerrado",
  certificado: "Certificado",
};

export default function EmitirCertificadoManual() {
  const [busca, setBusca] = useState("");
  const [alunoId, setAlunoId] = useState<number | null>(null);
  const [contratoNivelId, setContratoNivelId] = useState<number | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const { data: alunos } = trpc.admin.listAlunos.useQuery();
  const alunosFiltrados = useMemo(() => {
    if (!alunos) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return (alunos as any[]).slice(0, 30);
    return (alunos as any[])
      .filter((a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [alunos, busca]);

  const { data: niveis, isLoading: carregandoNiveis } = trpc.meuDesempenho.listarNiveis.useQuery(
    { alunoId: alunoId ?? undefined },
    { enabled: !!alunoId }
  );

  const utils = trpc.useUtils();
  const emitirManualMutation = trpc.certificacao.emitirManual.useMutation({
    onSuccess: (data) => {
      toast.success("Certificado emitido manualmente com sucesso.");
      setJustificativa("");
      utils.meuDesempenho.listarNiveis.invalidate({ alunoId: alunoId ?? undefined });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Não foi possível emitir o certificado.");
    },
  });

  const nivelSelecionado = niveis?.find((n: any) => n.contratoNivelId === contratoNivelId);
  const podeEmitir = !!alunoId && !!contratoNivelId && justificativa.trim().length >= 10 && !nivelSelecionado?.certificadoEmitido;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Emissão Manual de Certificado
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Para contratos já finalizados que nunca passaram por um reset formal — não há dados
            congelados para validar automaticamente, então essa emissão exige revisão e justificativa.
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Confira os registros do aluno (sessões, metas, competências) antes de emitir — esta via
            não passa pelas checagens automáticas de engajamento/desafios mínimos.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Selecione o aluno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setAlunoId(null);
                setContratoNivelId(null);
              }}
            />
            {busca && !alunoId && (
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {alunosFiltrados.length === 0 && (
                  <p className="text-sm text-gray-400 p-3">Nenhum aluno encontrado.</p>
                )}
                {alunosFiltrados.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAlunoId(a.id);
                      setBusca(a.name);
                      setContratoNivelId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">{a.name}</span>
                    {a.email && <span className="text-gray-400 ml-2">{a.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {alunoId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Selecione o nível/macrociclo</CardTitle>
              <CardDescription>Somente níveis sem certificado emitido aparecem selecionáveis.</CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoNiveis ? (
                <div className="flex items-center text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando níveis...
                </div>
              ) : (
                <Select
                  value={contratoNivelId ? String(contratoNivelId) : undefined}
                  onValueChange={(v) => setContratoNivelId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {(niveis || []).map((n: any) => (
                      <SelectItem
                        key={n.contratoNivelId}
                        value={String(n.contratoNivelId)}
                        disabled={n.certificadoEmitido}
                      >
                        Nível {n.nivel} — {STATUS_LABEL[n.status] || n.status}
                        {n.certificadoEmitido ? " (já certificado)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {alunoId && contratoNivelId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Justificativa</CardTitle>
              <CardDescription>Obrigatória — fica registrada no certificado para fins de auditoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ex: Contrato finalizado em 2023, antes da implantação do fluxo de reset. Dados de sessões, metas e competências revisados manualmente e confirmam conclusão do nível."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
              />
              <Button
                onClick={() =>
                  alunoId &&
                  contratoNivelId &&
                  emitirManualMutation.mutate({ alunoId, contratoNivelId, justificativa })
                }
                disabled={!podeEmitir || emitirManualMutation.isPending}
              >
                {emitirManualMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Award className="w-4 h-4 mr-2" />
                )}
                Emitir certificado manualmente
              </Button>

              {emitirManualMutation.isSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Certificado emitido.{" "}
                    {emitirManualMutation.data?.arquivoUrl && (
                      <a
                        href={emitirManualMutation.data.arquivoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-medium"
                      >
                        Abrir PDF
                      </a>
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
