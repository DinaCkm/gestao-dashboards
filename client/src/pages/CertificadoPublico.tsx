import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { LOGO_ECO_AO_BEM_BASE64 } from "@/lib/logoBase64";
import { Loader2 } from "lucide-react";

const NIVEL_TITULO: Record<string, string> = {
  I: "Líder Nível I",
  II: "Líder Nível II",
  III: "Líder Nível III",
  IV: "Líder Nível IV",
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-white shadow-lg print:shadow-none border-[10px] border-double border-[#0A1E3E] p-12 print:p-10">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <img src={LOGO_ECO_AO_BEM_BASE64} alt="B.E.M." className="h-12 object-contain mb-2" />
          <p className="uppercase tracking-[0.3em] text-xs text-gray-500">Certificado de Conclusão</p>
          <h1 className="text-3xl font-serif font-bold text-[#0A1E3E]">{nivelTitulo}</h1>
        </div>

        <div className="text-center space-y-4 my-10">
          <p className="text-gray-600">Certificamos que</p>
          <p className="text-2xl font-serif font-semibold text-gray-900">{data.alunoNome}</p>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            concluiu com êxito o <strong>{nivelTitulo}</strong> do programa de mentoria
            {data.programaNome ? <> promovido por <strong>{data.programaNome}</strong></> : null}, no
            período de <strong>{formatarData(data.periodo?.dataInicio)}</strong> a{" "}
            <strong>{formatarData(data.periodo?.dataFim)}</strong>, tendo atendido aos critérios de
            engajamento, desenvolvimento de competências e desempenho estabelecidos para a certificação.
          </p>
        </div>

        {data.mentoras && data.mentoras.length > 0 && (
          <p className="text-center text-xs text-gray-400 mb-8">
            Acompanhamento realizado por: {data.mentoras.join(", ")}
          </p>
        )}

        <div className="flex justify-around items-end gap-8 mt-16 mb-6">
          {data.assinaturas.map((a: any) => (
            <div key={a.tipo} className="flex flex-col items-center text-center w-56">
              {a.imagemAssinaturaUrl ? (
                <img src={a.imagemAssinaturaUrl} alt={a.nomeExibicao} className="h-12 object-contain mb-1" />
              ) : (
                <div className="h-12" />
              )}
              <div className="w-full border-t border-gray-400 pt-1">
                <p className="text-sm font-medium text-gray-800">{a.nomeExibicao}</p>
                <p className="text-xs text-gray-500">{a.cargo}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-12 pt-4 border-t border-gray-200">
          <span>Emitido em {formatarData(data.emitidoEm)}</span>
          <span>Código de verificação: {data.hashDocumento}</span>
        </div>
      </div>
    </div>
  );
}
