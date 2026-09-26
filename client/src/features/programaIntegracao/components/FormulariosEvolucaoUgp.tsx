import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronRight, Handshake, UserCheck, Users } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  evolucaoPorPapel,
  evolucaoPesquisaColaborador,
  INDICES_PESQUISA_COLABORADOR,
  PILARES_ACOMPANHAMENTO,
  percentualNumero,
  type RespostaAcompanhamento,
} from '../helpers/evolucaoAcompanhamento';
import { PUBLIC_FORM_CATALOG, optionValueLabel } from '../helpers/publicFormCatalog';

type TipoModal = 'colaborador' | 'gestor' | 'anjo';

const CORES = ['#2563EB','#0F766E','#7C3AED','#D97706','#DC2626','#0891B2'];

function diaDoAlinhamento(ciclo: number) {
  return [15,45,75,150][Number(ciclo || 0) - 1] || Number(ciclo || 0);
}

function catalogoDaResposta(form: string) {
  if (form === 'pesquisa') return PUBLIC_FORM_CATALOG['pesquisa-integracao'];
  if (form === 'aval') return PUBLIC_FORM_CATALOG['avaliacao-programa'];
  return null;
}

function perguntasCatalogo(form: string) {
  const catalogo = catalogoDaResposta(form);
  if (!catalogo) return [];
  return catalogo.sections.flatMap((secao) =>
    secao.questions.map((pergunta) => ({ secao: secao.title, ...pergunta }))
  );
}

function textoValor(valor: unknown): string {
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : 'Não informado';
  const texto = String(valor == null ? '' : valor).trim();
  return texto || 'Não informado';
}

function valorApresentado(
  pergunta: ReturnType<typeof perguntasCatalogo>[number],
  valor: unknown,
): string {
  if (!pergunta.options || !pergunta.options.length) return textoValor(valor);
  const mapa = new Map(pergunta.options.map((opt) => {
    const item = optionValueLabel(opt);
    return [item.value, item.label] as const;
  }));
  if (Array.isArray(valor)) return valor.map((v) => mapa.get(String(v)) || String(v)).join(', ');
  const texto = textoValor(valor);
  return mapa.get(texto) || texto;
}

function EvolucaoColaborador({ respostas }: { respostas: RespostaAcompanhamento[] }) {
  const momentos = useMemo(() => evolucaoPesquisaColaborador(respostas), [respostas]);
  const dados = momentos.map((m) => ({ momento: m.label, ...m.indices }));

  if (!momentos.length) {
    return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">O colaborador ainda não possui Pesquisa de Integração respondida.</div>;
  }

  return (
    <div className="space-y-5">
      <details className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold text-blue-800">De onde vêm estes percentuais?</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>O colaborador responde à Pesquisa de Integração em escala de 1 a 5. As perguntas são agrupadas por tema, a média de cada grupo é calculada e multiplicada por 20 para apresentação em 0 a 100.</p>
          <p>Exemplo: média 3,0 = 60%; média 4,0 = 80%; média 5,0 = 100%. Respostas 0 (“sem opinião”) não entram na média.</p>
          <p>No item de sobrecarga, a escala é invertida para que percentuais maiores mantenham o mesmo sentido de percepção mais favorável.</p>
        </div>
      </details>

      <div className="h-[320px] rounded-xl bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="momento" />
            <YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} tickFormatter={(v) => String(v) + '%'} />
            <ChartTooltip formatter={(v: number) => Number(v).toFixed(1).replace('.', ',') + '%'} />
            <Legend />
            {INDICES_PESQUISA_COLABORADOR.map((grupo, i) => (
              <Line key={grupo.chave} type="linear" dataKey={grupo.chave} name={grupo.nome} stroke={CORES[i % CORES.length]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left">Dimensão</th>
              {momentos.map((m) => <th key={m.ciclo} className="px-3 py-3 text-center">Alinhamento de {diaDoAlinhamento(m.ciclo)} dias</th>)}
            </tr>
          </thead>
          <tbody>
            {INDICES_PESQUISA_COLABORADOR.map((grupo) => (
              <tr key={grupo.chave} className="border-t hover:bg-[#F7F5FF]">
                <td className="px-3 py-3 font-medium">{grupo.nome}</td>
                {momentos.map((m) => (
                  <td key={m.ciclo} className="px-3 py-3 text-center font-semibold tabular-nums">
                    {m.indices[grupo.chave] == null ? '—' : Number(m.indices[grupo.chave]).toFixed(1).replace('.', ',') + '%'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvolucaoPapel({ respostas, papel }: { respostas: RespostaAcompanhamento[]; papel: 'Gestor' | 'Anjo' }) {
  const momentos = useMemo(() => evolucaoPorPapel(respostas, papel), [respostas, papel]);
  const dados = momentos.map((m) => ({ momento: m.label, ...m.pilares }));
  const ultimo = momentos[momentos.length - 1];

  if (!momentos.length) {
    return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Ainda não há avaliações registradas nesta visão.</div>;
  }

  return (
    <div className="space-y-5">
      <details className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-semibold text-slate-900">Como ler esta avaliação?</summary>
        <p className="mt-3 leading-relaxed">As linhas mostram a média das respostas do {papel} em seis pilares. Cada pergunta é respondida na escala original de 1 a 5; os valores do gráfico permanecem nessa escala.</p>
      </details>

      <div className="h-[320px] rounded-xl bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="momento" />
            <YAxis domain={[0,5]} ticks={[0,1,2,3,4,5]} />
            <ChartTooltip formatter={(v: number) => Number(v).toFixed(2).replace('.', ',')} />
            <Legend />
            {PILARES_ACOMPANHAMENTO.map((p, i) => (
              <Line key={p.chave} type="linear" dataKey={p.chave} name={p.nome} stroke={CORES[i % CORES.length]} strokeWidth={2.2} dot={{ r: 4 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left">Pilar</th>
              {momentos.map((m) => <th key={m.ciclo} className="px-3 py-3 text-center">{m.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {PILARES_ACOMPANHAMENTO.map((p) => (
              <tr key={p.chave} className="border-t hover:bg-[#F7F5FF]">
                <td className="px-3 py-3 font-medium">{p.nome}</td>
                {momentos.map((m) => (
                  <td key={m.ciclo} className="px-3 py-3 text-center tabular-nums">
                    {m.pilares[p.chave] == null ? '—' : Number(m.pilares[p.chave]).toFixed(2).replace('.', ',')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ultimo && (
        <div>
          <div className="mb-3 text-sm font-semibold text-slate-900">Indicadores complementares do formulário</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Desenvolvimento', ultimo.desenvolvimento, 38],
              ['Produtividade', ultimo.produtividade, 39],
              ['Conceito Geral', ultimo.conceitoGeral, 40],
            ].map(([label, value, pergunta]) => {
              const n = percentualNumero(String(value));
              return (
                <div key={String(label)} className="rounded-xl border bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{n == null ? String(value || '—') : String(n) + '%'}</div>
                  {n != null && <Progress value={n} className="mt-3 h-2 [&>div]:bg-violet-600" />}
                  <div className="mt-3 text-xs leading-relaxed text-slate-500">Pergunta {String(pergunta)} · escala 0/25/50/75/100%.</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RespostasDetalhadas({ respostas }: { respostas: RespostaAcompanhamento[] }) {
  const registros = respostas
    .filter((r) => r.form === 'pesquisa' || (r.form === 'aval' && (r.papel === 'Gestor' || r.papel === 'Anjo')))
    .slice()
    .sort((a,b) => {
      const ordem = (r: RespostaAcompanhamento) => r.form === 'pesquisa' ? 0 : r.papel === 'Gestor' ? 1 : 2;
      return ordem(a) - ordem(b) || Number(a.ciclo) - Number(b.ciclo);
    });

  if (!registros.length) return <div className="rounded-xl border border-dashed p-6 text-sm text-slate-500">Ainda não há respostas detalhadas disponíveis.</div>;

  return (
    <div className="space-y-4">
      {registros.map((resposta, indice) => {
        const papel = resposta.form === 'pesquisa' ? 'Colaborador' : resposta.papel;
        const perguntas = perguntasCatalogo(resposta.form);
        const answers = resposta.answers || {};
        const secoes = perguntas.reduce<Record<string, typeof perguntas>>((acc, pergunta) => {
          if (!(pergunta.code in answers)) return acc;
          if (!acc[pergunta.secao]) acc[pergunta.secao] = [];
          acc[pergunta.secao].push(pergunta);
          return acc;
        }, {});
        const classes = papel === 'Colaborador'
          ? 'border-blue-200 bg-blue-50/40'
          : papel === 'Gestor'
            ? 'border-teal-200 bg-teal-50/40'
            : 'border-amber-200 bg-amber-50/40';

        return (
          <div key={resposta.form + '-' + resposta.papel + '-' + String(resposta.ciclo) + '-' + String(indice)} className={'rounded-xl border p-4 ' + classes}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-950">{papel}</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  {resposta.form === 'pesquisa' ? 'Pesquisa de Integração' : 'Avaliação do Programa'} · alinhamento de {diaDoAlinhamento(resposta.ciclo)} dias
                </div>
              </div>
              <Badge variant="outline" className="bg-white/70">{papel}</Badge>
            </div>

            {!Object.keys(secoes).length ? (
              <div className="mt-3 text-sm text-slate-500">A resposta existe, mas o detalhamento pergunta a pergunta não está disponível nesta versão do registro.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {Object.entries(secoes).map(([secao, itens]) => (
                  <section key={secao}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{secao}</div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {itens.map((pergunta) => (
                        <div key={pergunta.code} className="rounded-lg bg-white/85 p-3">
                          <div className="text-xs leading-relaxed text-slate-500">{pergunta.label}</div>
                          <div className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{valorApresentado(pergunta, answers[pergunta.code])}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FormulariosEvolucaoUgp({ respostas }: { respostas: RespostaAcompanhamento[] }) {
  const [modal, setModal] = useState<TipoModal | null>(null);

  const opcoes = [
    {
      tipo: 'colaborador' as const,
      titulo: 'Evolução — Colaborador',
      subtitulo: 'Pesquisa de Integração',
      detalhe: 'Acompanha como o próprio colaborador percebe sua integração ao longo dos alinhamentos.',
      icon: UserCheck,
      card: 'border-blue-200 hover:border-blue-300 hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,.24)]',
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      tipo: 'gestor' as const,
      titulo: 'Evolução — Gestor',
      subtitulo: 'Avaliação do Programa',
      detalhe: 'Mostra a percepção do Gestor nos seis pilares e nos indicadores complementares.',
      icon: Users,
      card: 'border-teal-200 hover:border-teal-300 hover:shadow-[0_8px_24px_-8px_rgba(15,118,110,.22)]',
      iconClass: 'bg-teal-50 text-teal-700',
    },
    {
      tipo: 'anjo' as const,
      titulo: 'Evolução — Anjo',
      subtitulo: 'Avaliação do Programa',
      detalhe: 'Mostra a percepção do Anjo nos mesmos pilares, mantendo a leitura separada da avaliação do Gestor.',
      icon: Handshake,
      card: 'border-amber-200 hover:border-amber-300 hover:shadow-[0_8px_24px_-8px_rgba(217,119,6,.22)]',
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ];

  const titulo = modal === 'colaborador'
    ? 'Evolução — Colaborador (Pesquisa de Integração)'
    : modal === 'gestor'
      ? 'Evolução — Percepção do Gestor sobre o Colaborador'
      : 'Evolução — Percepção do Anjo sobre o Colaborador';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.05)]">
        <h3 className="text-lg font-semibold text-slate-950">Evolução dos formulários</h3>
        <p className="mt-1 max-w-4xl text-sm leading-relaxed text-slate-600">Cada instrumento tem finalidade e escala próprias. Abra a evolução desejada; Pesquisa, Gestor e Anjo permanecem separados para evitar comparação indevida.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {opcoes.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.tipo}
              type="button"
              onClick={() => setModal(item.tipo)}
              className={'group rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,.05)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ' + item.card}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={'grid h-10 w-10 shrink-0 place-items-center rounded-xl ' + item.iconClass}><Icon className="h-5 w-5" /></span>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-slate-950">{item.titulo}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{item.subtitulo}</div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detalhe}</p>
              <div className="mt-4 text-sm font-semibold text-violet-700">Abrir evolução</div>
            </button>
          );
        })}
      </div>

      <details className="rounded-2xl border border-slate-200 bg-[#FAFAFD]">
        <summary className="cursor-pointer list-none px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">Respostas detalhadas dos formulários</div>
              <div className="mt-1 text-sm text-slate-500">Recolhido por padrão. Abra para consultar pergunta por pergunta, separada por papel e alinhamento.</div>
            </div>
            <ChevronRight className="h-5 w-5 text-violet-600" />
          </div>
        </summary>
        <div className="border-t border-slate-200 px-5 py-5"><RespostasDetalhadas respostas={respostas} /></div>
      </details>

      <Dialog open={modal != null} onOpenChange={(open) => { if (!open) setModal(null); }}>
        <DialogContent className="overflow-hidden p-0" style={{ width: 'min(1450px, calc(100vw - 32px))', maxWidth: 'none', maxHeight: '92vh' }}>
          <div className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b bg-white px-6 py-5 text-left">
              <DialogTitle className="text-xl">{titulo}</DialogTitle>
              <DialogDescription>Visualização da evolução ao longo dos alinhamentos.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto bg-[#F6F6FA] p-5 sm:p-6">
              {modal === 'colaborador' && <EvolucaoColaborador respostas={respostas} />}
              {modal === 'gestor' && <EvolucaoPapel respostas={respostas} papel="Gestor" />}
              {modal === 'anjo' && <EvolucaoPapel respostas={respostas} papel="Anjo" />}
            </div>
            <div className="flex justify-end border-t bg-white px-6 py-4"><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
