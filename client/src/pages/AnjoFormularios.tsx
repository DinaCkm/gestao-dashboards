import { useEffect, useMemo, useState, type CSSProperties } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AnjoRouteGuard from "@/features/programaIntegracao/components/AnjoRouteGuard";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { carregarFormulariosAnjo, type AnjoFormulariosResponse } from "@/features/programaIntegracao/api/anjo";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import "@/features/programaIntegracao/styles/acompanhamentoIntegracao.css";

function formatarData(value: string | null) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + "T12:00:00")
    : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

function iniciaisPessoa(nome: string) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "—";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function matizPessoa(id: number, nome: string) {
  const base = String(id || nome || "anjo");
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

function CountUpValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      value <= 0
    ) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const inicio = performance.now();
    const duracao = 850;
    setDisplay(0);

    const tick = (agora: number) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setDisplay(Math.round(value * suavizado));
      if (progresso < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

export default function AnjoFormularios() {
  const [, setLocation] = useLocation();
  const [dados, setDados] = useState<AnjoFormulariosResponse | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarFormulariosAnjo()
      .then((res) => { if (ativo) setDados(res); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar os formulários."); })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, []);

  const menorPrazo = useMemo(() => {
    const prazos = (dados?.formularios || [])
      .filter((item) => item.status === "pendente" && item.prazo)
      .map((item) => String(item.prazo))
      .sort();
    return prazos[0] || null;
  }, [dados]);

  return (
    <DashboardLayout>
      <AnjoRouteGuard>
        <div className="pi-acompanhamento pi-anjo-page mx-auto">
          <header className="pi-hero">
            <div className="pi-hero-top">
              <div>
                <span className="pi-eyebrow pi-eyebrow--icon"><Sparkles /> Espaço do Anjo</span>
                <h1>Acompanhar Integração</h1>
                <p className="pi-hero-subtitle">
                  Acompanhe seus formulários e a evolução das avaliações que você mesmo respondeu ao longo da integração.
                </p>
              </div>
              <button type="button" className="pi-btn pi-btn--white" onClick={() => setLocation("/anjo/orientacoes")}>
                <BookOpen /> Ver cartilha <ArrowRight />
              </button>
            </div>

            {!loading && !erro && dados && (
              <div className="pi-insight">
                <Sparkles className="h-4 w-4" />
                {dados.indicadores.pendentes > 0 ? (
                  <span>
                    Você tem <strong>{dados.indicadores.pendentes} {dados.indicadores.pendentes === 1 ? "formulário" : "formulários"}</strong> disponível{dados.indicadores.pendentes === 1 ? "" : "is"} para responder
                    {menorPrazo ? <> · prazo até <strong>{formatarData(menorPrazo)}</strong></> : null}
                  </span>
                ) : (
                  <span>Nenhum formulário pendente no momento.</span>
                )}
              </div>
            )}
          </header>

          {loading ? (
            <div className="pi-anjo-state-card pi-loading">
              <Loader2 className="animate-spin" />
              <div className="pi-anjo-state-title">Carregando seus acompanhamentos...</div>
            </div>
          ) : erro ? (
            <div className="pi-anjo-state-card pi-loading pi-anjo-error">
              <div className="pi-anjo-state-title">Não foi possível carregar os formulários.</div>
              <div className="pi-anjo-state-subtitle">{erro}</div>
            </div>
          ) : !dados?.formularios.length ? (
            <div className="pi-anjo-state-card pi-loading">
              <ClipboardCheck />
              <div className="pi-anjo-state-title">Você não possui integrações ativas sob seu acompanhamento no momento.</div>
              <div className="pi-anjo-state-subtitle">Quando houver um processo ativo em que você esteja vinculado como Anjo, ele aparecerá aqui.</div>
            </div>
          ) : (
            <>
              <div className="pi-kpi-grid pi-anjo-kpi-area">
                <article className="pi-kpi pi-kpi--info">
                  <div className="pi-kpi-head">
                    <span className="pi-kpi-icon"><Clock3 className="h-[18px] w-[18px]" /></span>
                    <span
                      className="pi-tag pi-tag--muted"
                      tabIndex={0}
                      data-pi-tip="Liberados após o envio do e-mail de cada alinhamento."
                    >
                      Próximos
                    </span>
                  </div>
                  <div className="pi-kpi-label">Aguardando liberação</div>
                  <div className="pi-kpi-value"><CountUpValue value={dados.indicadores.aguardando} /></div>
                  <div className="pi-kpi-hint">formulários futuros</div>
                </article>

                <article className="pi-kpi pi-kpi--warn">
                  <div className="pi-kpi-head">
                    <span className="pi-kpi-icon"><FileText className="h-[18px] w-[18px]" /></span>
                    <span className="pi-tag pi-tag--warn">Sua ação</span>
                  </div>
                  <div className="pi-kpi-label">Pendentes</div>
                  <div className="pi-kpi-value"><CountUpValue value={dados.indicadores.pendentes} /></div>
                  <div className="pi-kpi-hint">para responder agora</div>
                </article>

                <article className={"pi-kpi pi-kpi--ok" + (dados.indicadores.respondidos === 0 ? " is-zero" : "")}>
                  <div className="pi-kpi-head">
                    <span className="pi-kpi-icon"><CheckCircle2 className="h-[18px] w-[18px]" /></span>
                    {dados.indicadores.respondidos === 0 && <span className="pi-tag pi-tag--muted">Nenhum ainda</span>}
                  </div>
                  <div className="pi-kpi-label">Respondidos</div>
                  <div className="pi-kpi-value"><CountUpValue value={dados.indicadores.respondidos} /></div>
                  <div className="pi-kpi-hint">avaliações enviadas</div>
                </article>
              </div>

              {dados.indicadores.pendentes === 0 && (
                <div className="pi-anjo-status-note">
                  <div className="pi-anjo-status-note-icon"><Sparkles className="h-5 w-5" /></div>
                  <div>
                    <strong>Parabéns! Você está em dia com os formulários.</strong>
                    <div className="mt-1 text-sm">
                      Não há formulários pendentes no momento. Os que ainda não estão disponíveis serão liberados no momento previsto da integração.
                    </div>
                  </div>
                </div>
              )}

              {!!dados.evolucao?.length && (
                <section className="pi-anjo-evolution">
                  <div className="pi-anjo-evolution-eyebrow">Minha evolução</div>
                  <h2 className="pi-anjo-evolution-title">Como minha percepção evoluiu</h2>
                  <p className="pi-anjo-evolution-subtitle">
                    Esta leitura considera exclusivamente as avaliações que você mesmo respondeu como Anjo.
                  </p>

                  <div className="pi-anjo-evolution-grid">
                    {dados.evolucao.map((item) => {
                      const chartData = item.ciclos.map((ciclo) => ({
                        momento: ciclo.label,
                        media: ciclo.mediaGeral,
                      }));
                      const ultimo = item.ciclos[item.ciclos.length - 1];
                      const pilares = [
                        ["Adaptação ao Trabalho", "adaptacao"],
                        ["Conduta Ética", "etica"],
                        ["Segurança da Informação", "seguranca"],
                        ["Postura no Trabalho", "postura"],
                        ["Trabalho em Equipe", "equipe"],
                        ["Qualidade do Trabalho", "qualidade"],
                      ] as const;

                      return (
                        <article key={item.processoId} className="pi-anjo-evolution-card">
                          <div className="pi-anjo-evolution-head">
                            <BarChart3 />
                            <div>
                              <div className="pi-anjo-evolution-name">{item.colaborador}</div>
                              <div className="pi-anjo-evolution-role">
                                {item.cargo || "Cargo não informado"}{item.unidade ? ` · ${item.unidade}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="pi-anjo-evolution-body">
                            <div className="h-[220px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                                  <CartesianGrid stroke="var(--pi-border-strong)" strokeDasharray="3 3" opacity={0.45} />
                                  <XAxis dataKey="momento" tick={{ fill: "var(--pi-muted)" }} />
                                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "var(--pi-muted)" }} />
                                  <Tooltip formatter={(value: number) => Number(value).toFixed(2).replace(".", ",")} />
                                  <Line
                                    type="monotone"
                                    dataKey="media"
                                    name="Minha percepção geral"
                                    stroke="var(--pi-brand-600)"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: "var(--pi-brand-600)" }}
                                    connectNulls
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            {ultimo && (
                              <div className="mt-4">
                                <div className="pi-anjo-evolution-label">Última avaliação · {ultimo.label} alinhamento</div>
                                <div className="pi-anjo-pillar-grid">
                                  {pilares.map(([nome, chave]) => (
                                    <div key={chave} className="pi-anjo-pillar">
                                      <div className="pi-anjo-pillar-label">{nome}</div>
                                      <div className="pi-anjo-pillar-value">
                                        {ultimo.pilares[chave] == null ? "—" : Number(ultimo.pilares[chave]).toFixed(2).replace(".", ",")}
                                        <small>/ 5</small>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="pi-anjo-form-grid pi-anjo-section">
                {dados.formularios.map((item) => {
                  const aguardando = item.status === "aguardando_liberacao";
                  const respondido = item.status === "respondido";
                  const atrasado = item.status === "pendente" && item.atrasado;
                  const disponivel = item.status === "pendente" && !item.atrasado;
                  const estadoClasse = aguardando
                    ? " is-locked"
                    : respondido
                      ? " is-done"
                      : atrasado
                        ? " is-overdue"
                        : " is-available";
                  const IconeFormulario = aguardando ? Lock : respondido ? Check : ClipboardCheck;

                  return (
                    <article key={`${item.processoId}-${item.ciclo}`} className={"pi-anjo-form-card" + estadoClasse}>
                      <div className="pi-anjo-form-top">
                        <div className="pi-anjo-person">
                          <span
                            className="pi-anjo-avatar"
                            style={{ "--pi-h": matizPessoa(item.processoId, item.colaborador) } as CSSProperties}
                          >
                            {iniciaisPessoa(item.colaborador)}
                          </span>
                          <div className="min-w-0">
                            <div className="pi-anjo-person-name">{item.colaborador}</div>
                            <div className="pi-anjo-person-role">
                              {item.cargo || "Cargo não informado"}{item.unidade ? ` · ${item.unidade}` : ""}
                            </div>
                          </div>
                        </div>

                        {respondido ? (
                          <span className="pi-anjo-pill pi-anjo-pill--ok"><Check /> Respondido</span>
                        ) : atrasado ? (
                          <span className="pi-anjo-pill pi-anjo-pill--danger"><Clock3 /> Atrasado</span>
                        ) : disponivel ? (
                          <span className="pi-anjo-pill pi-anjo-pill--warn"><span className="pi-anjo-dot" /> Disponível</span>
                        ) : (
                          <span className="pi-anjo-pill pi-anjo-pill--muted"><Lock /> Aguardando liberação</span>
                        )}
                      </div>

                      <div className="pi-anjo-form-box">
                        <span className="pi-anjo-icon-tile is-small"><IconeFormulario /></span>
                        <div className="min-w-0">
                          <div className="pi-anjo-form-name">{item.nome}</div>
                          <div className="pi-anjo-form-sub">{item.ciclo}.º alinhamento · item {item.itemId}</div>
                        </div>
                        <div
                          className="pi-anjo-stepper"
                          tabIndex={0}
                          data-pi-tip={`Alinhamento ${item.ciclo} de 4`}
                        >
                          {[0, 1, 2, 3].map((indice) => <span key={indice} className={indice < item.ciclo ? "is-on" : ""} />)}
                        </div>
                      </div>

                      <div className="pi-anjo-form-foot">
                        {aguardando && (
                          <div className="pi-anjo-locked-message"><Mail /> {item.bloqueioMotivo}</div>
                        )}

                        {respondido && (
                          <div className="pi-anjo-locked-message is-done">
                            <CheckCircle2 /> Resposta registrada em {formatarData(item.respondidoEm)}.
                          </div>
                        )}

                        {disponivel && (
                          <>
                            <div className="pi-anjo-deadline">
                              <Clock3 />
                              <span>
                                Disponível{item.solicitadoEm ? <> desde {formatarData(item.solicitadoEm)}</> : null}
                                {item.prazo ? <> · prazo <strong>{formatarData(item.prazo)}</strong></> : null}.
                                {" "}Você ainda está dentro do prazo.
                              </span>
                            </div>
                            <button type="button" className="pi-btn pi-btn--primary" onClick={() => { window.location.href = item.rotaPublica; }}>
                              Responder formulário <ArrowRight />
                            </button>
                          </>
                        )}

                        {atrasado && (
                          <>
                            <div className="pi-anjo-deadline">
                              <Clock3 />
                              <span>Prazo encerrado em <strong>{formatarData(item.prazo)}</strong>.</span>
                            </div>
                            <button type="button" className="pi-btn pi-btn--primary" onClick={() => { window.location.href = item.rotaPublica; }}>
                              Responder agora <ArrowRight />
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AnjoRouteGuard>
    </DashboardLayout>
  );
}
