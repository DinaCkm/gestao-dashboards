import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { LOGO_ECO_DO_BEM_FULL_BASE64, LOGO_CKM_BASE64 } from "@/lib/certificadoLogos";
import { Loader2, CheckSquare, Square } from "lucide-react";
function formatarData(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  if (Number.isNaN(date.getTime())) return "—";
  // timeZone: "UTC" evita deslocamento de um dia (ver mesmo comentário em
  // CertificadoPublico.tsx).
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function labelMacrociclo(nivelLabel: string | null, numeroCiclo: number | null) {
  if (nivelLabel) return `Nível ${nivelLabel}`;
  return numeroCiclo ? `Ciclo ${numeroCiclo}` : "—";
}

const CRITERIOS_LABELS: Record<string, string> = {
  nivelEncerrado: "Nível, ciclo ou etapa formalmente encerrado",
  snapshotCongelado: "Dados consolidados e corretamente separados por etapa",
  resultadoFinalFechado: "Resultado final definido",
  engajamentoMin80: "Engajamento final igual ou superior à meta estabelecida",
  desafiosMin80: "Metas, desafios ou tarefas concluídos conforme o percentual mínimo",
  evidenciasMinimas: "Evidência ou case entregue, quando aplicável",
};

function Checkbox({ marcado, children }: { marcado: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {marcado ? <CheckSquare className="w-4 h-4 mt-0.5 shrink-0" /> : <Square className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />}
      <span className={marcado ? "text-gray-800" : "text-gray-400"}>{children}</span>
    </div>
  );
}

export default function RelatorioFinalImpressao() {
  const [, params] = useRoute("/aluno/relatorio-final/:chave");
  // wouter não decodifica automaticamente o parâmetro de rota — como o link
  // que leva aqui é montado com encodeURIComponent (necessário pra chaves com
  // ":", tipo "historico:14"), sem decodificar aqui a chave chega ao servidor
  // com o "%3A" literal, nunca batendo com nenhum macrociclo real.
  const chave = params?.chave ? decodeURIComponent(params.chave) : "";
  // alunoId só é necessário quando a página é renderizada fora do contexto do
  // próprio aluno (ex.: emissão manual pelo admin, gerando o PDF via cookie
  // administrativo) — nesse caso o admin passa ?alunoId=X na URL.
  const alunoIdParam = new URLSearchParams(window.location.search).get("alunoId");
  const alunoId = alunoIdParam ? Number(alunoIdParam) : undefined;

  const { data: desempenho, isLoading, error } = trpc.meuDesempenho.porMacrociclo.useQuery(
    { chave, alunoId },
    { enabled: !!chave, retry: false }
  );

  const cicloAtual = desempenho?.macrociclo?.status === "ativo";
  const cicloCongelado = desempenho?.macrociclo?.origem === "reset" && !cicloAtual && !!desempenho?.macrociclo?.historicoId;

  const { data: dashboardAtual } = trpc.indicadores.meuDashboard.useQuery(
    { viewAlunoId: alunoId },
    { enabled: cicloAtual }
  );
  const { data: dashboardCongelado } = trpc.indicadores.meuDashboardCongelado.useQuery(
    { historicoId: desempenho?.macrociclo?.historicoId ?? undefined, viewAlunoId: alunoId },
    { enabled: cicloCongelado }
  );
  const fonteIndicadores: any = cicloAtual ? dashboardAtual : dashboardCongelado;
  const consolidado = fonteIndicadores?.found !== false ? fonteIndicadores?.indicadoresV2?.consolidado : null;
  const cargaHoraria = fonteIndicadores?.found !== false ? fonteIndicadores?.cargaHoraria : null;
  const cargaHorariaPorNivel = fonteIndicadores?.found !== false ? (fonteIndicadores?.cargaHorariaPorNivel || []) : [];

  // Erro real (ex.: macrociclo não encontrado, sem permissão) — mostra a
  // mensagem em vez de girar pra sempre. Sem isso, qualquer falha na busca
  // dos dados fazia a página (e a geração do PDF em cima dela) travar
  // "carregando" indefinidamente, sem nenhum sinal do que deu errado.
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-600 font-medium">Não foi possível carregar este relatório.</p>
        <p className="text-sm text-gray-400 mt-2">{error.message}</p>
      </div>
    );
  }

  if (isLoading || !desempenho) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando relatório...
      </div>
    );
  }

  const criterios = (desempenho.certificacao?.criterios || {}) as Record<string, boolean>;
  const elegivel = !!desempenho.certificacao?.elegivel;
  const nivelTitulo = labelMacrociclo(desempenho.macrociclo.nivelLabel, desempenho.macrociclo.numeroCiclo);
  const engajamentoFinal = consolidado?.ind7_engajamentoFinal ?? null;
  const certificadoEmitido = desempenho.certificacao?.certificadoEmitido as any;
  const codigoIdentificacao = certificadoEmitido?.hashDocumento || null;

  const obrigatorias = desempenho.avaliacaoCompetencias.filter((c: any) => c.obrigatoria);
  const aprovadas = obrigatorias.filter((c: any) => c.aprovada).length;

  return (
    <div className="bg-white text-gray-800 max-w-4xl mx-auto p-8 print:p-0" style={{ fontSize: 13 }}>
      <div className="flex items-center justify-between border-b-2 pb-3 mb-6" style={{ borderColor: "#33BACE" }}>
        <img src={LOGO_ECO_DO_BEM_FULL_BASE64} alt="Eco do Bem" className="h-10 object-contain" />
        <p className="text-center font-bold text-xs" style={{ color: "#351A4F" }}>
          PROGRAMA DE DESENVOLVIMENTO DE<br />COMPETÊNCIAS DE LIDERANÇA
        </p>
        <img src={LOGO_CKM_BASE64} alt="CKM" className="h-9 object-contain" />
      </div>

      <h1 className="text-2xl font-bold text-center" style={{ color: "#351A4F" }}>RELATÓRIO DE APROVEITAMENTO</h1>
      <p className="text-center mt-1 mb-6 text-gray-700">
        Programa de Desenvolvimento de Competências de Liderança - Eco do Bem
      </p>

      <div className="grid grid-cols-2 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="p-3 border-b border-r" style={{ borderColor: "#E5E7EB", backgroundColor: "#F5F0FA" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Participante</p>
          <p className="font-medium">{desempenho.aluno.nome}</p>
        </div>
        <div className="p-3 border-b" style={{ borderColor: "#E5E7EB", backgroundColor: "#F5F0FA" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Nível / Ciclo</p>
          <p className="font-medium">{nivelTitulo}</p>
        </div>
        <div className="p-3 border-r" style={{ borderColor: "#E5E7EB", backgroundColor: "#F0F7FA" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Período</p>
          <p className="font-medium">
            {desempenho.todosNiveis && desempenho.todosNiveis.length > 1 ? (
              desempenho.todosNiveis.map((n: any, idx: number) => (
                <span key={n.nivel}>
                  <strong>Nível {n.nivel}</strong>: {formatarData(n.dataInicio)} a {formatarData(n.dataFim)}
                  {idx < desempenho.todosNiveis.length - 1 ? " e " : ""}
                </span>
              ))
            ) : (
              <>{formatarData(desempenho.macrociclo.periodo?.dataInicio)} a {formatarData(desempenho.macrociclo.periodo?.dataFim)}</>
            )}
          </p>
        </div>
        <div className="p-3" style={{ backgroundColor: "#F0F7FA" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Data de emissão</p>
          <p className="font-medium">{formatarData(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="text-center p-2 border border-t-0" style={{ borderColor: "#33BACE" }}>
        <p className="text-[10px] uppercase font-bold" style={{ color: "#351A4F" }}>Código de Identificação do Conjunto Documental</p>
        <p className="text-sm font-bold" style={{ color: "#351A4F" }}>
          {codigoIdentificacao || "Atribuído na emissão do certificado"}
        </p>
      </div>

      <h2 className="text-base font-bold mt-6 mb-1" style={{ color: "#1F2937" }}>1. Síntese executiva</h2>
      <div className="grid grid-cols-3 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="p-3 border-b border-r" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Resultado Final</p>
          <p className="font-medium">{engajamentoFinal !== null ? `${engajamentoFinal}%` : "—"}</p>
        </div>
        <div className="p-3 border-b border-r" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Situação</p>
          <p className="font-medium">{elegivel ? "Aprovado(a)" : "Não Aprovado(a)"}</p>
        </div>
        <div className="p-3 border-b" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Certificação</p>
          <p className="font-medium">{elegivel ? "Elegível" : "Não Elegível"}</p>
        </div>
        <div className="p-3 border-r" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Etapa Encerrada Em</p>
          <p className="font-medium">{formatarData(desempenho.macrociclo.periodo?.dataFim)}</p>
        </div>
        <div className="p-3 border-r" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Meta da Etapa</p>
          <p className="font-medium">80%</p>
        </div>
        <div className="p-3">
          <p className="text-[10px] uppercase text-gray-500 font-semibold">Evidência / Case</p>
          <p className="font-medium">{criterios.evidenciasMinimas ? "Entregue" : "Pendente"}</p>
        </div>
      </div>
      {cargaHoraria && (
        <p className="text-xs text-gray-500 mt-1.5">
          <strong>Carga horária total do programa nesta etapa:</strong> {cargaHoraria.total}h
          {" "}(competências: {cargaHoraria.competencias}h · tarefas: {cargaHoraria.tarefas}h ·
          {" "}mentorias: {cargaHoraria.mentorias}h · webinars: {cargaHoraria.webinars}h)
        </p>
      )}

      {cargaHorariaPorNivel && cargaHorariaPorNivel.length > 1 && (
        <>
          <h2 className="text-base font-bold mt-6 mb-1" style={{ color: "#1F2937" }}>1.1 Espelho de carga horária por etapa</h2>
          <table className="w-full text-xs border" style={{ borderColor: "#E5E7EB" }}>
            <thead>
              <tr style={{ backgroundColor: "#351A4F" }}>
                <th className="text-left p-2 text-white font-semibold">Nível</th>
                <th className="text-left p-2 text-white font-semibold">Período</th>
                <th className="text-right p-2 text-white font-semibold">Competências</th>
                <th className="text-right p-2 text-white font-semibold">Tarefas</th>
                <th className="text-right p-2 text-white font-semibold">Mentorias</th>
                <th className="text-right p-2 text-white font-semibold">Webinars</th>
                <th className="text-right p-2 text-white font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {cargaHorariaPorNivel.map((n: any) => (
                <tr key={n.nivel} className="border-t" style={{ borderColor: "#E5E7EB" }}>
                  <td className="p-2 font-medium">Nível {n.nivel}</td>
                  <td className="p-2 text-gray-600">{formatarData(n.dataInicio)} a {formatarData(n.dataFim)}</td>
                  <td className="p-2 text-right">{n.competencias}h</td>
                  <td className="p-2 text-right">{n.tarefas}h</td>
                  <td className="p-2 text-right">{n.mentorias}h</td>
                  <td className="p-2 text-right">{n.webinars}h</td>
                  <td className="p-2 text-right font-semibold">{n.total}h</td>
                </tr>
              ))}
              <tr className="border-t-2" style={{ borderColor: "#351A4F" }}>
                <td className="p-2 font-bold" colSpan={2}>Total geral</td>
                <td className="p-2 text-right font-bold">{cargaHorariaPorNivel.reduce((s: number, n: any) => s + n.competencias, 0)}h</td>
                <td className="p-2 text-right font-bold">{cargaHorariaPorNivel.reduce((s: number, n: any) => s + n.tarefas, 0)}h</td>
                <td className="p-2 text-right font-bold">{cargaHorariaPorNivel.reduce((s: number, n: any) => s + n.mentorias, 0)}h</td>
                <td className="p-2 text-right font-bold">{cargaHorariaPorNivel.reduce((s: number, n: any) => s + n.webinars, 0)}h</td>
                <td className="p-2 text-right font-bold">{cargaHorariaPorNivel.reduce((s: number, n: any) => s + n.total, 0)}h</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h2 className="text-base font-bold mt-6 mb-1" style={{ color: "#1F2937" }}>2. Indicadores de participação e desempenho</h2>
      <div className="grid grid-cols-3 border" style={{ borderColor: "#E5E7EB" }}>
        {[
          ["Ind.1 Webinars", consolidado?.ind1_webinars, 80],
          ["Ind.2 Avaliações", consolidado?.ind2_avaliacoes, 80],
          ["Ind.3 Competências", consolidado?.ind3_competencias, 80],
          ["Ind.4 Tarefas", consolidado?.ind4_tarefas, 80],
          ["Ind.5 Engajamento", consolidado?.ind5_engajamento, 80],
          ["Ind.6 Aplicabilidade", consolidado?.ind6_aplicabilidade, 80],
        ].map(([label, value, meta], idx) => (
          <div
            key={label as string}
            className={`p-3 text-center ${idx % 3 < 2 ? "border-r" : ""} ${idx < 3 ? "border-b" : ""}`}
            style={{ borderColor: "#E5E7EB" }}
          >
            <p className="text-[10px] uppercase text-gray-500 font-semibold">{label}</p>
            <p className="text-xl font-bold" style={{ color: "#351A4F" }}>{value !== null && value !== undefined ? `${value}%` : "—"}</p>
            <p className="text-[10px] text-gray-400">Meta: {meta}%</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        Resultado Final (Engajamento Final consolidado): {engajamentoFinal !== null ? `${engajamentoFinal}%` : "—"} — ver Síntese executiva acima.
      </p>

      <h2 className="text-base font-bold mt-6 mb-1" style={{ color: "#1F2937" }}>3. Avaliação das competências</h2>
      <p className="text-xs text-gray-500 mb-1">{aprovadas} de {obrigatorias.length} competências obrigatórias aprovadas.</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#351A4F" }}>
            <th className="text-left text-white p-2 font-semibold">Competência</th>
            <th className="text-left text-white p-2 font-semibold">Obrigatória</th>
            <th className="text-left text-white p-2 font-semibold">Nota</th>
            <th className="text-left text-white p-2 font-semibold">Meta</th>
            <th className="text-left text-white p-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {desempenho.avaliacaoCompetencias.map((c: any, idx: number) => (
            <tr key={c.competenciaId} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB" }}>
              <td className="p-2 border-b" style={{ borderColor: "#E5E7EB" }}>{c.competenciaNome || "—"}</td>
              <td className="p-2 border-b" style={{ borderColor: "#E5E7EB" }}>{c.obrigatoria ? "Sim" : "Opcional"}</td>
              <td className="p-2 border-b" style={{ borderColor: "#E5E7EB" }}>{c.nota !== null ? c.nota.toFixed(1) : "—"}</td>
              <td className="p-2 border-b" style={{ borderColor: "#E5E7EB" }}>{c.meta.toFixed(1)}</td>
              <td className="p-2 border-b" style={{ borderColor: "#E5E7EB" }}>
                {c.nota === null ? "—" : c.aprovada ? "Aprovada" : "Abaixo da meta"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-base font-bold mt-6 mb-1" style={{ color: "#1F2937" }}>4. Verificação para certificação</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 border p-3" style={{ borderColor: "#E5E7EB" }}>
        {Object.entries(CRITERIOS_LABELS).map(([chaveCriterio, label]) => (
          <Checkbox key={chaveCriterio} marcado={!!criterios[chaveCriterio]}>{label}</Checkbox>
        ))}
      </div>

      <div className="mt-6 p-3 border" style={{ borderColor: "#33BACE", backgroundColor: "#F0FBFC" }}>
        <p className="text-xs font-bold" style={{ color: "#351A4F" }}>OBSERVAÇÃO INSTITUCIONAL</p>
        <p className="text-xs text-gray-600 mt-1">
          A conclusão no Programa de Desenvolvimento de Competências de Liderança - Eco do Bem reconhece
          o percurso de desenvolvimento realizado e o atendimento aos critérios estabelecidos para a
          etapa. Este Relatório de Aproveitamento integra o conjunto documental de certificação e deve
          apresentar o mesmo Código de Identificação constante no certificado correspondente.
        </p>
      </div>

      {/* Controle de autenticidade */}
      <div className="mt-6">
        <div className="text-center py-1.5 font-bold text-white text-xs" style={{ backgroundColor: "#351A4F" }}>
          CONTROLE DE AUTENTICIDADE
        </div>
        <div className="grid grid-cols-2 border border-t-0" style={{ borderColor: "#33BACE" }}>
          <div className="p-3 text-center border-r" style={{ borderColor: "#33BACE", backgroundColor: "#F0FBFC" }}>
            <p className="text-[10px] uppercase font-bold" style={{ color: "#351A4F" }}>Código de Identificação</p>
            <p className="text-sm font-bold" style={{ color: "#351A4F" }}>{codigoIdentificacao || "—"}</p>
          </div>
          <div className="p-3 text-center" style={{ backgroundColor: "#F0FBFC" }}>
            <p className="text-[10px] uppercase font-bold" style={{ color: "#351A4F" }}>Consulta de Autenticidade</p>
            <p className="text-xs" style={{ color: "#351A4F" }}>
              {codigoIdentificacao ? `ecolider.ecodobem.com/certificados/verificar/${codigoIdentificacao}` : "—"}
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          A autenticidade será confirmada pela correspondência deste código no Certificado, neste
          Relatório de Aproveitamento e no registro eletrônico de validação.
        </p>
      </div>

      {/* Assinatura */}
      {desempenho.assinaturas && desempenho.assinaturas.length > 0 ? (
        <div className="flex justify-center mt-8">
          {desempenho.assinaturas.map((a: any) => (
            <div key={a.tipo + a.nomeExibicao} className="flex flex-col items-center text-center w-72">
              <div className="w-full border-t border-gray-400 pt-1">
                <p className="text-sm font-bold" style={{ color: "#351A4F" }}>{a.nomeExibicao}</p>
                <p className="text-xs text-gray-600">{a.cargo}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="text-center text-[10px] text-gray-400 mt-8">
        Relatório gerado em {formatarData(new Date().toISOString())} · Documento de uso institucional
      </div>
    </div>
  );
}
