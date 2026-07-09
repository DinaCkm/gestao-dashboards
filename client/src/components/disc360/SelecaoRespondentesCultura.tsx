import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy } from "lucide-react";

type Props = {
  programId: number;
  orgProfileId: number;
};

export default function SelecaoRespondentesCultura({ programId, orgProfileId }: Props) {
  const { data: alunos = [] } = trpc.disc360.searchAlunosForSelection.useQuery({ programId });
  const { data: convites = [], refetch: refetchConvites } = trpc.disc360.listarConvitesCulturaEmpresa.useQuery(
    { orgProfileId },
    { enabled: !!orgProfileId }
  );

  const [selecionados, setSelecionados] = useState<number[]>([]);

  const criarConvitesMutation = trpc.disc360.criarConvitesCulturaEmpresa.useMutation({
    onSuccess: () => {
      toast.success("Convites gerados. Copie os links abaixo para enviar aos colaboradores.");
      setSelecionados([]);
      refetchConvites();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao gerar convites."),
  });

  const listaConvites = (convites ?? []) as any[];
  const listaAlunos = (alunos ?? []) as any[];
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
      return { alunoId: id, respondentName: aluno?.name ?? "Colaborador" };
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
        <CardTitle className="text-base">Selecionar respondentes</CardTitle>
        <CardDescription>
          Selecione os colaboradores que devem responder a pesquisa de cultura da empresa (minimo
          recomendado: 5). Depois de gerar, copie o link de cada pessoa e envie por WhatsApp,
          e-mail ou o canal que preferir. Cada pessoa responde pelo proprio link, sem precisar de
          login no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alunosDisponiveis.length === 0 ? (
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
                </label>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleGerarConvites}
          disabled={criarConvitesMutation.isPending || selecionados.length === 0}
        >
          {criarConvitesMutation.isPending ? "Gerando..." : `Gerar convite (${selecionados.length})`}
        </Button>

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
    </Card>
  );
}
