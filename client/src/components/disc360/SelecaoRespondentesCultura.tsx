import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Eye } from "lucide-react";

type Props = {
  programId: number;
  orgProfileId: number;
};

export default function SelecaoRespondentesCultura({ programId, orgProfileId }: Props) {
  const { user } = useAuth();
  const isGestor = user?.role === "manager";
  const { data: alunos = [] } = trpc.disc360.searchAlunosForSelection.useQuery({ programId });
  const { data: convites = [], refetch: refetchConvites } = trpc.disc360.listarConvitesCulturaEmpresa.useQuery(
    { orgProfileId },
    { enabled: !!orgProfileId }
  );

  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [previewAberto, setPreviewAberto] = useState(false);

  const { data: perguntasPreview = [], isLoading: carregandoPreview } = trpc.disc360.getCultureQuestions.useQuery(
    undefined,
    { enabled: previewAberto }
  );

  const criarConvitesMutation = trpc.disc360.criarConvitesCulturaEmpresa.useMutation({
    onSuccess: (data: any) => {
      const enviados = (data ?? []).filter((c: any) => c.emailEnviado).length;
      const semEmail = (data ?? []).length - enviados;
      if (enviados > 0) {
        toast.success(
          enviados + " convite(s) enviado(s) por e-mail." +
            (semEmail > 0 ? " " + semEmail + " sem e-mail cadastrado - copie o link manualmente." : "")
        );
      } else {
        toast.success("Convites gerados. Copie os links abaixo para enviar aos colaboradores.");
      }
      setSelecionados([]);
      refetchConvites();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao gerar convites."),
  });

  const listaConvites = (convites ?? []) as any[];
  const listaAlunos = (alunos ?? []) as any[];
  const listaPerguntasPreview = (perguntasPreview ?? []) as any[];
  const jaConvidadoIds = new Set(listaConvites.map((c) => c.alunoId).filter((id) => id != null));
  const alunosDisponiveis = listaAlunos.filter((a) => !jaConvidadoIds.has(a.id));

  const toggleSelecionado = (id: number) => {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGerarConvites = () => {
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um colaborador.");
      return;
    }
    const convitesInput = selecionados.map((id) => {
      const aluno = listaAlunos.find((a) => a.id === id);
      return {
        alunoId: id,
        respondentName: aluno?.name ?? "Colaborador",
        respondentEmail: aluno?.email ?? null,
      };
    });
    criarConvitesMutation.mutate({ programId, orgProfileId, convites: convitesInput });
  };

  const copiarLink = (token: string) => {
    const url = `${window.location.origin}/disc360/responder-convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Selecionar respondentes</CardTitle>
            <CardDescription>
              Selecione os colaboradores que devem responder a pesquisa de cultura da empresa
              (minimo recomendado: 5). Quem tiver e-mail cadastrado recebe o link
              automaticamente; para quem nao tiver, copie o link e envie por WhatsApp ou outro
              canal. Cada pessoa responde pelo proprio link, sem precisar de login.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreviewAberto(true)}>
            <Eye className="h-4 w-4 mr-1" /> Visualizar questionário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGestor ? (
          <p className="text-sm text-muted-foreground">
            O envio de convites do questionário é restrito à administração. Fale com o time CKM para convidar novos respondentes.
          </p>
        ) : alunosDisponiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todos os colaboradores elegiveis ja foram convidados.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {alunosDisponiveis.map((aluno: any) => (
              <div key={aluno.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`aluno-convite-${aluno.id}`}
                  checked={selecionados.includes(aluno.id)}
                  onCheckedChange={() => toggleSelecionado(aluno.id)}
                />
                <label htmlFor={`aluno-convite-${aluno.id}`} className="text-sm cursor-pointer">
                  {aluno.name}
                  {!aluno.email && (
                    <span className="text-muted-foreground"> (sem e-mail cadastrado)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}

        {!isGestor && <Button
          onClick={handleGerarConvites}
          disabled={criarConvitesMutation.isPending || selecionados.length === 0}
        >
          {criarConvitesMutation.isPending ? "Gerando..." : `Gerar convite (${selecionados.length})`}
        </Button>}

        {listaConvites.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Convites</p>
            {listaConvites.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
              >
                <span>
                  {c.respondentName}{" "}
                  <span className={c.status === "concluido" ? "text-green-600" : "text-amber-600"}>
                    ({c.status === "concluido" ? "respondido" : "pendente"})
                  </span>
                </span>
                {c.status !== "concluido" && c.conviteToken && (
                  <Button variant="ghost" size="sm" onClick={() => copiarLink(c.conviteToken)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar link
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={previewAberto} onOpenChange={setPreviewAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia do questionário de cultura</DialogTitle>
            <DialogDescription>
              É apenas para visualização - as respostas aqui não são salvas. Cada colaborador
              convidado responde pelo próprio link.
            </DialogDescription>
          </DialogHeader>
          {carregandoPreview ? (
            <p className="text-sm text-muted-foreground">Carregando perguntas...</p>
          ) : (
            <div className="space-y-4">
              {listaPerguntasPreview.map((pergunta: any, index: number) => (
                <div key={pergunta.id} className="space-y-1">
                  <p className="text-sm font-medium">
                    {index + 1}. {pergunta.tema}
                  </p>
                  <p className="text-sm text-muted-foreground">{pergunta.pergunta}</p>
                  <ul className="text-sm list-disc pl-5 space-y-0.5">
                    {pergunta.alternativas.map((alt: any) => (
                      <li key={alt.id}>{alt.texto}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
