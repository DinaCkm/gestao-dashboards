import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { LOGO_ECO_DO_BEM_FULL_BASE64, LOGO_CKM_BASE64 } from "@/lib/certificadoLogos";
import { Loader2 } from "lucide-react";

const NIVEL_TITULO: Record<string, string> = {
  I: "Nível I",
  II: "Nível II",
  III: "Nível III",
  IV: "Nível IV",
};

function formatarData(d: string | null | undefined) {
  if (!d) return "";
  const date = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function CertificadoPublico() {
  const [, params] = useRoute("/certificados/verificar/:hash");
  const hash = params?.hash || "";

  const { data, isLoading, error } = trpc.certificacao.publico.useQuery(
    { hash },
    { enabled: !!hash, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando certificado...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl font-semibold text-gray-700">Certificado não encontrado</h1>
        <p className="text-sm text-gray-500 mt-2">
          O código informado não corresponde a nenhum certificado válido emitido.
        </p>
      </div>
    );
  }

  const nivelTitulo = NIVEL_TITULO[data.nivel] || `Nível ${data.nivel}`;
  const assinaturas = data.assinaturas || [];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 print:p-0 print:bg-white">
      <div
        className="w-full max-w-5xl bg-white shadow-lg print:shadow-none p-10 print:p-6"
        style={{ border: "3px solid #351A4F" }}
      >
        {/* Cabeçalho: logo Eco do Bem, título do programa, logo CKM */}
        <div className="flex items-start justify-between gap-4">
          <img src={LOGO_ECO_DO_BEM_FULL_BASE64} alt="Eco do Bem" className="h-12 object-contain" />
          <p className="text-center font-bold text-sm tracking-wide flex-1 pt-2" style={{ color: "#351A4F" }}>
            PROGRAMA DE DESENVOLVIMENTO DE<br />COMPETÊNCIAS DE LIDERANÇA - ECO DO BEM
          </p>
          <img src={LOGO_CKM_BASE64} alt="CKM" className="h-11 object-contain" />
        </div>

        {/* Corpo */}
        <div className="text-center mt-4 print:mt-3">
          <h1 className="text-4xl font-bold" style={{ color: "#1F2937" }}>CERTIFICADO</h1>
          <p className="text-gray-500 mt-1">de conclusão de nível, ciclo ou trilha</p>

          <p className="text-gray-600 mt-4 print:mt-3">Certificamos que</p>
          <p className="text-2xl font-bold mt-2" style={{ color: "#33BACE" }}>{data.alunoNome}</p>

          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed mt-4 print:mt-3">
            {data.todosNiveis && data.todosNiveis.length > 1 ? (
              <>concluiu etapas do Programa de Desenvolvimento de Competências de Liderança - Eco do Bem</>
            ) : (
              <>concluiu a etapa <strong>{nivelTitulo}</strong></>
            )}
            {data.turmaNome ? <>, da turma <strong>{data.turmaNome}</strong></> : null}
            {data.todosNiveis && data.todosNiveis.length > 1 ? null : (
              <>, do Programa de Desenvolvimento de Competências de Liderança - Eco do Bem</>
            )}
            {data.programaNome ? <> (<strong>{data.programaNome}</strong>)</> : null}, realizada no
            período de{" "}
            {data.todosNiveis && data.todosNiveis.length > 1 ? (
              <>
                {data.todosNiveis.map((n: any, idx: number) => (
                  <span key={n.nivel}>
                    <strong>Nível {n.nivel}</strong>: {formatarData(n.dataInicio)} a {formatarData(n.dataFim)}
                    {idx < data.todosNiveis.length - 1 ? " e " : ""}
                  </span>
                ))}
              </>
            ) : (
              <>
                <strong>{formatarData(data.periodo?.dataInicio)}</strong> a{" "}
                <strong>{formatarData(data.periodo?.dataFim)}</strong>
              </>
            )}
            , atendendo aos critérios de participação, desempenho e entregas estabelecidos para esta
            etapa de desenvolvimento.
          </p>

          <p className="text-gray-500 mt-4 print:mt-3">{formatarData(data.emitidoEm)}.</p>
        </div>

        {/* Validade documental */}
        <div className="mt-4 print:mt-3 p-3 border text-center" style={{ borderColor: "#33BACE", backgroundColor: "#F0FBFC" }}>
          <p className="text-xs font-bold" style={{ color: "#351A4F" }}>VALIDADE DOCUMENTAL</p>
          <p className="text-xs text-gray-600 mt-1">
            Este certificado somente é válido quando apresentado em conjunto com o Relatório de
            Aproveitamento correspondente, que contém o mesmo Código de Identificação e registra as
            competências desenvolvidas, os resultados obtidos e o aproveitamento do participante.
          </p>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          A autenticidade será confirmada pela correspondência do código no certificado, no relatório e
          no registro eletrônico de validação.
        </p>

        {/* Assinatura(s) */}
        <div className="flex justify-center items-end gap-10 mt-4 print:mt-3">
          {assinaturas.length > 0 ? (
            assinaturas.map((a: any) => (
              <div key={a.tipo + a.nomeExibicao} className="flex flex-col items-center text-center w-72">
                {a.imagemAssinaturaUrl && (
                  <img src={a.imagemAssinaturaUrl} alt="" className="h-10 object-contain mb-1" />
                )}
                <div className="w-full border-t border-gray-400 pt-1">
                  <p className="text-sm font-bold" style={{ color: "#351A4F" }}>{a.nomeExibicao}</p>
                  <p className="text-xs text-gray-600">{a.cargo}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center text-center w-72">
              <div className="w-full border-t border-gray-400 pt-1">
                <p className="text-sm font-bold text-gray-400">—</p>
              </div>
            </div>
          )}
        </div>

        {/* Código de identificação e verificação */}
        <div className="text-center mt-3 print:mt-2">
          <p className="text-sm font-bold" style={{ color: "#351A4F" }}>Código de Identificação: {data.hashDocumento}</p>
          <p className="text-xs text-gray-500 mt-1">
            Consulta de autenticidade: ecolider.ecodobem.com/certificados/verificar/{data.hashDocumento}
          </p>
          {data.emissaoManual && (
            <p className="text-[10px] text-gray-400 mt-1">
              Certificado emitido mediante revisão administrativa dos registros do aluno.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
