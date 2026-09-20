import React from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import { checarPreparacaoMentora } from '../helpers/mentoraStateHelpers';
import { conteudoBriefingMentora } from '../helpers/mentoraDocumentos';
import { Button } from '@/components/ui/button';

interface BriefingMentoraPreviewProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  config: BootstrapState['config'];
  feriados?: string[];
  onClose: () => void;
  onGerarPdf: () => Promise<void> | void;
  onGerarWord: () => Promise<void> | void;
  onConferir: () => void;
}

export function BriefingMentoraPreview({
  processo,
  numero,
  config,
  feriados = [],
  onClose,
  onGerarPdf,
  onGerarWord,
  onConferir,
}: BriefingMentoraPreviewProps) {
  const check = checarPreparacaoMentora(processo, numero, config, feriados);
  const b = conteudoBriefingMentora(processo, numero, config, feriados);

  const sec = (titulo: string, children: React.ReactNode) => (
    <section className="space-y-2 border-t pt-4">
      <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-[#A82D33]">{titulo}</h4>
      {children}
    </section>
  );
  const lista = (itens: string[], ordenada = false) => {
    const Tag = ordenada ? 'ol' : 'ul';
    return <Tag className={`space-y-1.5 pl-5 text-sm ${ordenada ? 'list-decimal' : 'list-disc'}`}>
      {itens.map((x, i) => <li key={i}>{x}</li>)}
    </Tag>;
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/50 p-3 md:p-8" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border bg-background shadow-2xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/20 p-4 md:p-5">
          <div>
            <h3 className="text-lg font-bold">Briefing da Mentora — {b.tituloAlinhamento}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{processo.nome} · mentora {b.mentoraNome}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </header>

        {check.bloqueios > 0 ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Faltam dados obrigatórios — o PDF não será gerado até que sejam preenchidos.
          </div>
        ) : check.avisos > 0 ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            Há {check.avisos} {check.avisos === 1 ? 'informação ausente' : 'informações ausentes'}. O que faltar aparece como ponto a levantar na reunião.
          </div>
        ) : (
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">Material completo — pronto para gerar.</div>
        )}

        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-x-6 gap-y-2 rounded-lg border bg-muted/10 p-4 text-sm md:grid-cols-[170px_1fr]">
            <b>Mentora / consultora</b><span>{b.mentoraNome}</span>
            <b>Colaborador(a)</b><span>{processo.nome || '—'}</span>
            <b>Cargo · Unidade</b><span>{[processo.cargo, processo.unidade].filter(Boolean).join(' · ') || '—'}</span>
            <b>Gestor(a)</b><span>{processo.gestor || '—'}</span>
            <b>Anjo</b><span>{processo.anjo || '—'}</span>
            <b>Data prevista</b><span>{b.dataPrevista} · alternativa {b.dataAlternativa}</span>
            <b>Confirmada</b><span>{b.confirmada}</span>
            <b>Link da reunião</b><span>{b.linkRegistrado ? 'registrado no sistema' : 'a confirmar'}</span>
            <b>Duração</b><span>cerca de 30 minutos</span>
          </div>

          {sec('Como vai ser a conversa', <>
            <p className="rounded-lg border-l-4 border-[#C8363C] bg-[#F7F5F4] p-3 text-sm font-semibold">
              Estrutura preferida — 10 min a sós com o gestor · 10 min com os dois juntos · 10 min a sós com o colaborador para encerrar.
            </p>
            <p className="text-sm">Você conduz a conversa, orienta as duas partes e depois repassa o que observou para a CKM. Quem dá o feedback é o gestor: você organiza o momento, escuta e registra. Você não monta o PDI e não revisa evidências uma a uma.</p>
          </>)}

          {sec('Contatos para a reunião', <div className="rounded-lg border text-sm">
            <div className="grid gap-1 border-b p-3 md:grid-cols-[180px_1fr]"><b>{processo.nome || 'Colaborador(a)'}</b><span>{processo.tel || 'telefone não informado'}{processo.email ? ` · ${processo.email}` : ''}</span></div>
            <div className="grid gap-1 border-b p-3 md:grid-cols-[180px_1fr]"><b>{processo.gestor || 'Gestor'} (gestor)</b><span>{processo.gestorTel || 'telefone não informado'}{processo.gestorEmail ? ` · ${processo.gestorEmail}` : ''}</span></div>
            <div className="grid gap-1 p-3 md:grid-cols-[180px_1fr]"><b>CKM Talents</b><span>{b.suporte}</span></div>
          </div>)}

          {sec('O que você precisa saber antes', <>
            <div><p className="text-sm font-semibold">Ações do PDI</p><p className="text-sm">{b.acoesPdi}</p></div>
            {numero === 1 ? <>
            <div>
              <p className="mb-2 text-sm font-semibold">Qualidades e competências que o gestor considera importantes</p>
              {b.qualidades.length ? <div className="flex flex-wrap gap-2">{b.qualidades.map((x) => <span key={x} className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs">{x}</span>)}</div> : <p className="text-sm text-muted-foreground">Não localizamos essa resposta no formulário Bem Acolhido — levante o ponto na conversa a sós com o gestor.</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Perfil DISC</p>
              <p className="text-sm">{b.ecoDiscTexto || b.testeResumo || 'Resultado ainda não registrado. Conduza a conversa a partir das percepções do gestor.'}</p>
              {b.ecoAutoavaliacao.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">Autoavaliação de competências</p>
                  {b.ecoAutoavaliacao.map((grupo) => (
                    <p key={grupo.nota} className="text-sm">
                      <b>Classificou como {grupo.label}:</b> {grupo.competencias.join(', ')}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <p className="rounded-lg bg-muted/30 p-3 text-sm font-semibold">Ponto obrigatório desta primeira conversa: pergunte ao gestor quais atividades o colaborador irá efetivamente desempenhar e anote. É com base nelas que a CKM monta o PDI de acordo com as atribuições reais da função — você não precisa elaborar o plano, só levantar a informação.</p>
          </> : <>
            <div><p className="text-sm font-semibold">Pendências</p><p className="text-sm">{b.pendencias}</p></div>
            {b.evolucao && <div><p className="text-sm font-semibold">Evolução registrada nos formulários do gestor</p><p className="text-sm">{b.evolucao}</p></div>}
          </>}
          </>)}

          {sec('Roteiro da conversa', <div className="space-y-4">
            <div><p className="mb-2 font-semibold">1 · A sós com o gestor — 10 minutos</p>{lista(b.roteiroGestor)}</div>
            <div><p className="mb-2 font-semibold">2 · Com o gestor e o colaborador juntos — 10 minutos</p>{lista(b.roteiroConjunto)}</div>
            <div><p className="mb-2 font-semibold">3 · A sós com o colaborador — 10 minutos, para encerrar</p>{lista(b.roteiroColaborador)}</div>
          </div>)}

          {sec('Não deixe de orientar', <div className="space-y-3">
            <div><p className="mb-1 text-sm font-semibold">1 · Jornada Compliance e cursos obrigatórios</p><p className="rounded-lg bg-muted/30 p-3 text-sm font-medium">{b.orientaEco}</p></div>
            {numero === 1 && <p className="text-sm text-muted-foreground">Só para o seu contexto: a carga total dos cursos institucionais passa de {b.totalHorasCursos || '—'} horas. Você não precisa listar nem mostrar os cursos — basta orientar onde encontrá-los. O volume alto é o motivo de o PDI ser enxuto.</p>}
            <div><p className="mb-1 text-sm font-semibold">2 · Formulários do alinhamento</p><p className="rounded-lg bg-muted/30 p-3 text-sm font-medium">{b.orientaForm}</p></div>
          </div>)}

          {sec('Depois da reunião', lista(b.depois, true))}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t bg-muted/10 p-4">
          <Button type="button" onClick={onGerarPdf}>Gerar Briefing PDF</Button>
          <Button type="button" variant="secondary" onClick={onGerarWord}>Relatório em Word</Button>
          <Button type="button" variant="outline" onClick={onConferir}>Conferir dados</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </footer>
      </div>
    </div>
  );
}
