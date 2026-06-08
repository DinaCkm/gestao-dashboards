import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { Megaphone, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProcessosSeletivosComunicado() {
  return (
    <DashboardLayout>
      <ComunicadoContent />
    </DashboardLayout>
  );
}

function ComunicadoContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as any)?.role === "admin2";

  const [processoId, setProcessoId] = useState<number | null>(null);
  const [comunicadoHtml, setComunicadoHtml] = useState("");

  const { data: processos = [] } = trpc.processosSeletivos.listarProcessos.useQuery();

  // Selecionar automaticamente o primeiro processo ativo ao carregar
  useEffect(() => {
    if (processos.length > 0 && !processoId) {
      const ativo = (processos as any[]).find((p) => p.status === "ativo") ?? (processos as any[])[0];
      if (ativo) setProcessoId(ativo.id);
    }
  }, [processos]);

  const queryInput = processoId ? { processoId } : null;
  const enabled = !!processoId;

  const { data: comunicadoData } = trpc.processosSeletivos.obterComunicado.useQuery(
    queryInput!,
    { enabled }
  );

  useEffect(() => {
    setComunicadoHtml(comunicadoData?.comunicado ?? "");
  }, [comunicadoData]);

  const salvarComunicado = trpc.processosSeletivos.salvarComunicado.useMutation({
    onSuccess: () => toast.success("Comunicado salvo com sucesso!"),
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f2b3c] flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Comunicado do Processo Seletivo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escreva e publique o comunicado do processo. Será visível para candidatos e mentores.
        </p>
      </div>

      {/* Seletor de processo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Selecionar Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={processoId ? String(processoId) : ""}
            onValueChange={(v) => setProcessoId(Number(v))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um processo seletivo..." />
            </SelectTrigger>
            <SelectContent>
              {(processos as any[]).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome} — {p.clienteNome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!processoId && (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um processo para editar o comunicado.</p>
        </div>
      )}

      {processoId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Comunicado
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Escreva o comunicado abaixo. Use negrito, itálico e listas para formatar o texto."
                : "Comunicado publicado para este processo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <>
                <RichTextEditor
                  value={comunicadoHtml}
                  onChange={setComunicadoHtml}
                  placeholder="Digite o comunicado do processo aqui..."
                  className="min-h-[400px]"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setComunicadoHtml(comunicadoData?.comunicado ?? "")}
                    disabled={salvarComunicado.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      processoId &&
                      salvarComunicado.mutate({ processoId, comunicado: comunicadoHtml })
                    }
                    disabled={salvarComunicado.isPending || !processoId}
                  >
                    {salvarComunicado.isPending ? "Salvando..." : "Salvar Comunicado"}
                  </Button>
                </div>
              </>
            ) : comunicadoData?.comunicado ? (
              <RichTextEditor
                value={comunicadoData.comunicado}
                onChange={() => {}}
                readOnly
              />
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nenhum comunicado publicado para este processo.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
