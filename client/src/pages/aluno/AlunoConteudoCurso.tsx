import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Maximize } from "lucide-react";

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

function adaptarUrlParaEmbed(url?: string | null) {
  if (!url) return "";

  let resultado = url.trim();
  if (!resultado) return "";

  if (/genially/i.test(resultado)) {
    resultado = resultado.replace("/view/", "/embed/");
    resultado = resultado.replace(/\/view(\?|$)/i, "/embed$1");
  }

  return resultado;
}

export default function AlunoConteudoCurso() {
  const [, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");
  const atividadeId = getNumeroQuery(search, "atividadeId");

  const atividadesQuery = trpc.competenciasCompTec.aluno.obterAtividadesCurso.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: !!cursoId && !!cursoAtribuidoId }
  );

  const atividade = useMemo(() => {
    return (atividadesQuery.data ?? []).find((item) => item.id === atividadeId) ?? null;
  }, [atividadeId, atividadesQuery.data]);

  const urlOriginal = atividade?.urlGenially || atividade?.urlMidia || "";
  const urlEmbed = adaptarUrlParaEmbed(urlOriginal);

  const [timerPausado, setTimerPausado] = useState(false);

  const heartbeatMutation = trpc.competenciasCompTec.aluno.registrarHeartbeatAtividade.useMutation();
  const pausarSessaoMutation = trpc.competenciasCompTec.aluno.pausarSessaoAtividade.useMutation();

  useEffect(() => {
    if (!cursoAtribuidoId || !atividadeId) return;

    let intervalId: NodeJS.Timeout;
    const HEARTBEAT_INTERVAL_MS = 15000;

    const enviarHeartbeat = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        heartbeatMutation.mutate({
          cursoAtribuidoId,
          atividadeId,
          segundosAtivos: HEARTBEAT_INTERVAL_MS / 1000,
        });
      }
    };

    const pausarSessao = () => {
      pausarSessaoMutation.mutate({
        cursoAtribuidoId,
        atividadeId,
      });
    };

    intervalId = setInterval(enviarHeartbeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pausarSessao();
        setTimerPausado(true);
      } else {
        setTimerPausado(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pausarSessao();
    };
  }, [cursoAtribuidoId, atividadeId]);

  const voltarParaAtividades = () => {
    setLocation(
      `/aluno/competencias-comp-tec/atividade?cursoId=${cursoId}&cursoAtribuidoId=${cursoAtribuidoId}`
    );
  };

  const abrirNovaAba = () => {
    if (!urlOriginal) return;
    window.open(urlOriginal, "_blank", "noopener,noreferrer");
  };

  const abrirTelaCheia = async () => {
    if (!iframeRef.current?.requestFullscreen) return;
    await iframeRef.current.requestFullscreen();
  };

  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aluno — Conteúdo do Curso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estude o conteúdo dentro da plataforma e, ao terminar, volte para seguir com a avaliação.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={voltarParaAtividades}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button variant="outline" onClick={abrirTelaCheia} disabled={!urlEmbed}>
            <Maximize className="mr-2 h-4 w-4" />
            Tela cheia
          </Button>
          {atividade?.permitirAberturaExterna === 1 && (
            <Button variant="outline" onClick={abrirNovaAba} disabled={!urlOriginal}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir em nova aba
            </Button>
          )}
        </div>
      </div>

      {timerPausado && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="text-lg">⏸</span>
          <div>
            <strong>Timer pausado.</strong> Você saiu desta aba e o tempo de estudo parou de ser contado.
            Volte para esta aba para continuar acumulando o tempo mínimo necessário para liberar a avaliação.
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{atividade?.titulo ?? "Conteúdo do curso"}</CardTitle>
          <CardDescription>
            O conteúdo é exibido internamente por iframe. Se o provedor bloquear a incorporação, use o botão de fallback para abrir em nova aba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atividadesQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando conteúdo...
            </div>
          ) : atividadesQuery.error ? (
            <p className="text-sm text-red-600">{atividadesQuery.error.message}</p>
          ) : !atividade ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Não foi possível localizar a atividade selecionada.
            </div>
          ) : !urlEmbed ? (
            <div className="space-y-4 rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Esta atividade não possui uma URL válida para incorporação.
              </p>
              {atividade?.permitirAberturaExterna === 1 && (
                <div className="flex justify-center">
                  <Button onClick={abrirNovaAba} disabled={!urlOriginal}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir em nova aba
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border bg-black/5">
                <iframe
                  ref={iframeRef}
                  key={urlEmbed}
                  src={urlEmbed}
                  title={atividade.titulo}
                  className="h-[75vh] w-full"
                  allow="fullscreen; autoplay"
                  allowFullScreen
                />
              </div>

              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                Se o conteúdo não carregar corretamente no iframe, use <strong>Abrir em nova aba</strong> como alternativa.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AlunoLayout>
  );
}
