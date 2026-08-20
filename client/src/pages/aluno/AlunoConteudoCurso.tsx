import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize, Clock, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * Sanitizador de HTML simples — sem dependências externas.
 * Permite apenas tags e atributos seguros (sem scripts, eventos, javascript:).
 * Usa o DOMParser nativo do browser para fazer o parsing seguro.
 */
function sanitizarHtml(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  const TAGS_PERMITIDAS = new Set([
    "h1","h2","h3","h4","h5","h6","p","strong","em","b","i","u","s",
    "ul","ol","li","a","img","br","hr","blockquote","pre","code",
    "table","thead","tbody","tfoot","tr","th","td","span","div","section",
  ]);
  const ATTRS_PERMITIDOS: Record<string, Set<string>> = {
    a: new Set(["href","target","rel"]),
    img: new Set(["src","alt","width","height","style"]),
    td: new Set(["colspan","rowspan"]),
    th: new Set(["colspan","rowspan"]),
    "*": new Set(["class","style"]),
  };
  const doc = new DOMParser().parseFromString(html, "text/html");
  function limpaNó(nó: Node): Node | null {
    if (nó.nodeType === Node.TEXT_NODE) return nó.cloneNode();
    if (nó.nodeType !== Node.ELEMENT_NODE) return null;
    const el = nó as Element;
    const tag = el.tagName.toLowerCase();
    if (!TAGS_PERMITIDAS.has(tag)) {
      // Substitui a tag por seus filhos (ex: <script> — joga fora)
      const frag = document.createDocumentFragment();
      el.childNodes.forEach((c) => { const limpo = limpaNó(c); if (limpo) frag.appendChild(limpo); });
      return frag;
    }
    const novo = document.createElement(tag);
    const permitidos = new Set([...(ATTRS_PERMITIDOS[tag] ?? []), ...(ATTRS_PERMITIDOS["*"] ?? [])]);
    el.getAttributeNames().forEach((attr) => {
      if (!permitidos.has(attr)) return;
      const val = el.getAttribute(attr) ?? "";
      // Bloquear javascript: em href/src
      if ((attr === "href" || attr === "src") && /^\s*javascript:/i.test(val)) return;
      novo.setAttribute(attr, val);
    });
    // Garantir que links externos abram em nova aba com rel seguro
    if (tag === "a") {
      novo.setAttribute("target", "_blank");
      novo.setAttribute("rel", "noopener noreferrer");
    }
    el.childNodes.forEach((c) => { const limpo = limpaNó(c); if (limpo) novo.appendChild(limpo); });
    return novo;
  }
  const resultado = document.createDocumentFragment();
  doc.body.childNodes.forEach((c) => { const limpo = limpaNó(c); if (limpo) resultado.appendChild(limpo); });
  const div = document.createElement("div");
  div.appendChild(resultado);
  return div.innerHTML;
}

function getNumeroQuery(search: string, chave: string) {
  const params = new URLSearchParams(search);
  return Number(params.get(chave) ?? 0);
}

/**
 * Converte qualquer URL do YouTube para o formato embed.
 * Suporta: watch?v=, youtu.be/, shorts/.
 * Retorna null se não reconhecer o formato.
 */
function youtubeParaEmbed(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  // https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = u.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }
  // Já é embed
  if (u.includes("youtube.com/embed/")) return u;
  return null;
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

function formatarTempo(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function AlunoConteudoCurso() {
  const [, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeCarregando, setIframeCarregando] = useState(true);
  const [iframeIniciado, setIframeIniciado] = useState(false);

  const searchString = useSearch(); // reativo a mudanças de rota
  const search = searchString ? `?${searchString}` : (typeof window !== "undefined" ? window.location.search : "");
  const cursoId = getNumeroQuery(search, "cursoId");
  const cursoAtribuidoId = getNumeroQuery(search, "cursoAtribuidoId");
  const atividadeId = getNumeroQuery(search, "atividadeId");

  const atividadesQuery = trpc.competenciasCompTec.aluno.obterAtividadesCurso.useQuery(
    { cursoId, cursoAtribuidoId },
    { enabled: !!cursoId && !!cursoAtribuidoId }
  );

  const atividade = useMemo(() => {
    return (atividadesQuery.data ?? []).find((item: any) => item.id === atividadeId) ?? null;
  }, [atividadeId, atividadesQuery.data]);

  const isPdf = atividade?.tipoAtividade === "pdf";
  const isPagina = atividade?.tipoAtividade === "pagina";
  const urlPdf = isPdf ? (atividade?.urlMidia || atividade?.urlGenially || "") : "";
  const urlOriginal = (!isPdf && !isPagina) ? (atividade?.urlGenially || atividade?.urlMidia || "") : "";
  const urlEmbed = (!isPdf && !isPagina) ? adaptarUrlParaEmbed(urlOriginal) : "";

  // Para o tipo "pagina": HTML sanitizado + vídeo YouTube opcional
  const htmlConteudo = isPagina
    ? sanitizarHtml(atividade?.urlGenially ?? "")
    : "";
  const youtubeEmbedPagina = isPagina ? youtubeParaEmbed(atividade?.descricao) : null;

  // Tempo acumulado local (em segundos), iniciado com o valor do banco
  const [tempoAtivoLocal, setTempoAtivoLocal] = useState<number>(0);
  const [timerPausado, setTimerPausado] = useState(false);

  // Inicializar tempo local com valor do banco quando atividade carregar
  useEffect(() => {
    if (atividade?.tempoAtivoAcumuladoSegundos != null) {
      setTempoAtivoLocal(Number(atividade.tempoAtivoAcumuladoSegundos));
    }
  }, [atividade?.id]);

  const tempoMinimoExigido = Number(atividade?.tempoMinimoExigidoSegundos ?? 0);
  const tempoRestante = Math.max(0, tempoMinimoExigido - tempoAtivoLocal);
  const percentual = tempoMinimoExigido > 0
    ? Math.min(100, Math.round((tempoAtivoLocal / tempoMinimoExigido) * 100))
    : 100;
  const tempoCumprido = tempoMinimoExigido <= 0 || tempoAtivoLocal >= tempoMinimoExigido;

  // Contador local de 1 em 1 segundo (apenas visual)
  useEffect(() => {
    if (!cursoAtribuidoId || !atividadeId) return;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        setTempoAtivoLocal((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [cursoAtribuidoId, atividadeId]);

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

  const abrirTelaCheia = async () => {
    if (!iframeRef.current?.requestFullscreen) return;
    await iframeRef.current.requestFullscreen();
  };

  // Determina se o conteúdo principal está disponível para exibição
  const temConteudo = isPdf ? !!urlPdf : isPagina ? !!htmlConteudo : !!urlEmbed;

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
          {/* Botão tela cheia apenas para conteúdo não-PDF e não-pagina */}
          {!isPdf && !isPagina && (
            <Button variant="outline" onClick={abrirTelaCheia} disabled={!urlEmbed}>
              <Maximize className="mr-2 h-4 w-4" />
              Tela cheia
            </Button>
          )}
          {/* Botão abrir PDF em nova aba */}
          {isPdf && urlPdf && (
            <Button variant="outline" asChild>
              <a href={urlPdf} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em nova aba
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progresso de tempo */}
      {tempoMinimoExigido > 0 && (
        <div className={`rounded-lg border p-4 space-y-2 ${tempoCumprido ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
          <div className="flex items-center justify-between text-sm font-medium">
            <div className={`flex items-center gap-2 ${tempoCumprido ? "text-green-800" : "text-amber-800"}`}>
              <Clock className="h-4 w-4" />
              {tempoCumprido ? (
                <span>✅ Tempo mínimo cumprido! Você já pode voltar e fazer a avaliação.</span>
              ) : (
                <span>
                  Aguarde o tempo mínimo para liberar a avaliação — faltam{" "}
                  <strong>{formatarTempo(tempoRestante)}</strong>
                </span>
              )}
            </div>
            <span className={`text-xs ${tempoCumprido ? "text-green-700" : "text-amber-700"}`}>
              {formatarTempo(tempoAtivoLocal)} / {formatarTempo(tempoMinimoExigido)}
            </span>
          </div>
          <Progress
            value={percentual}
            className={`h-2 ${tempoCumprido ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"}`}
          />
          {!tempoCumprido && timerPausado && (
            <p className="text-xs text-amber-700">
              ⏸ Timer pausado — você saiu desta aba. Volte para continuar acumulando tempo.
            </p>
          )}
        </div>
      )}

      {timerPausado && tempoMinimoExigido <= 0 && (
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
            {isPdf
              ? "O documento PDF está exibido diretamente abaixo. Use o botão 'Abrir em nova aba' para visualizar em tela cheia."
              : "O conteúdo é exibido internamente por iframe. Se o provedor bloquear a incorporação, use o botão de fallback para abrir em nova aba."}
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
          ) : !temConteudo ? (
            <div className="space-y-4 rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Esta atividade não possui um conteúdo válido para incorporação.
              </p>
            </div>
          ) : isPagina ? (
            /* ===== PÁGINA DE CONTEÚDO (HTML + YouTube) ===== */
            <div className="space-y-6">
              {/* Conteúdo HTML sanitizado */}
              <div
                className="prose prose-slate max-w-none rounded-lg border bg-white p-6 md:p-8"
                style={{
                  lineHeight: "1.8",
                  fontSize: "16px",
                }}
                dangerouslySetInnerHTML={{ __html: htmlConteudo }}
              />

              {/* Vídeo YouTube — só renderiza se tiver URL válida */}
              {youtubeEmbedPagina && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-red-600">▶</span> Vídeo complementar
                  </h3>
                  <div className="relative overflow-hidden rounded-lg border bg-black" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={youtubeEmbedPagina}
                      title="Vídeo complementar"
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      style={{ border: "none" }}
                    />
                    {/* Mesmas camadas do tipo vídeo normal:
                        - Camada 1: cobre a barra inferior completa (logo YouTube, botão "Assistir no YouTube", barra de progresso)
                        - Camada 2: cobre a linha de transição com o botão de abrir no YouTube */}
                    <div
                      className="pointer-events-auto absolute bottom-0 left-0 right-0 z-10"
                      style={{ height: 80, background: "rgba(0,0,0,0.01)" }}
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-auto absolute left-0 right-0 z-10"
                      style={{ bottom: 78, height: 12, background: "rgba(0,0,0,0.01)" }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    <span className="text-lg">⚠️</span>
                    <p>
                      <strong>Assista o vídeo dentro do sistema.</strong>{" "}
                      O tempo de visualização é contabilizado aqui, não no YouTube.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : isPdf ? (
            /* ===== VISUALIZAÇÃO DE PDF EMBEDADO ===== */
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border bg-gray-50">
                <iframe
                  key={urlPdf}
                  src={urlPdf}
                  title={atividade.titulo}
                  className="h-[80vh] w-full"
                  style={{ border: "none" }}
                />
              </div>
              <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <span className="mt-0.5 text-lg">📄</span>
                <p>
                  <strong>Leia o documento PDF na tela do sistema.</strong>{" "}
                  O sistema acompanha o tempo que você permanece nesta página para liberar a avaliação.
                  Caso o PDF não carregue, use o botão <strong>"Abrir em nova aba"</strong> acima.
                </p>
              </div>
            </div>
          ) : (
            /* ===== VISUALIZAÇÃO DE VÍDEO / GENIALLY / OUTROS ===== */
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border bg-black/5">
                {!iframeIniciado ? (
                  <div
                    className="h-[75vh] w-full flex flex-col items-center justify-center gap-4 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => {
                      setIframeIniciado(true);
                      setIframeCarregando(true);
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">Clique para iniciar</p>
                      <p className="text-slate-400 text-sm mt-1">O conteúdo será carregado ao clicar</p>
                      <p className="text-amber-400 text-xs mt-2 font-medium">💡 Dica: use tela cheia para melhor experiência</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {iframeCarregando && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-slate-300 text-sm">Carregando conteúdo...</p>
                        <p className="text-slate-500 text-xs">Isso pode levar alguns segundos</p>
                      </div>
                    )}
                    {!iframeCarregando && (
                      <button
                        onClick={abrirTelaCheia}
                        className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                        title="Abrir em tela cheia para melhor experiência"
                      >
                        ⛶ Tela Cheia
                      </button>
                    )}
                    <iframe
                      ref={iframeRef}
                      key={urlEmbed}
                      src={urlEmbed}
                      title={atividade.titulo}
                      className="h-[75vh] w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                      allowFullScreen
                      onLoad={() => setIframeCarregando(false)}
                      style={{ opacity: iframeCarregando ? 0 : 1, transition: 'opacity 0.4s' }}
                    />
                    {/* Camadas que cobrem a barra do YouTube (impedir pular o vídeo).
                        NÃO aplicar em Genially: ele tem controles e interações próprios
                        na parte de baixo (som, "Descobrir →", navegação) que ficariam
                        bloqueados por estas camadas. */}
                    {!/genially/i.test(urlOriginal) && (
                      <>
                        <div
                          className="pointer-events-auto absolute bottom-0 left-0 right-0 z-10"
                          style={{ height: 80, background: "rgba(0,0,0,0.01)" }}
                          aria-hidden="true"
                        />
                        <div
                          className="pointer-events-auto absolute left-0 right-0 z-10"
                          style={{ bottom: 78, height: 12, background: "rgba(0,0,0,0.01)" }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <span className="text-lg">💡</span>
                <p>
                  <strong>Dica:</strong> Se o conteúdo estiver lento ou com dificuldade de visualização, clique em <strong>⛶ Tela Cheia</strong> no canto superior direito do player para uma experiência melhor.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <span className="mt-0.5 text-lg">⚠️</span>
                <p>
                  <strong>Assista o vídeo na tela do sistema, não migre para o YouTube.</strong>{" "}
                  Isto evitará que o sistema possa acompanhar a sua performance e prejudicar sua avaliação.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AlunoLayout>
  );
}
