import React, { useEffect, useMemo, useState } from 'react';
import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  adicionarHorarioMentora,
  alternarPreparacaoMentora,
  checarPreparacaoMentora,
  estadoMentoraAlinhamento,
  linkWhatsAppMentora,
  marcarBriefingMentora,
  marcarConfirmacaoMentora,
  marcarPedidoDisponibilidadeMentora,
  marcarWordMentora,
  mensagemConfirmacaoMentora,
  mensagemDisponibilidadeMentora,
  mentoraVinculada,
  mentorasAtivas,
  removerHorarioMentora,
  substituirHorariosMentora,
  telefoneBonitoMentora,
  sugerirTelefoneGestorMentora,
  usarHorariosMentoraNoGestor,
  vincularMentoraProcesso,
  type HorarioMentora,
} from '../helpers/mentoraStateHelpers';
import { BriefingMentoraPreview } from './BriefingMentoraPreview';
import { buscarPerfilEcoLider, type EcoLiderPerfil, type EcoLiderAluno } from '../api/ecoLider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MentoraPreparacaoPainelProps {
  processo: ProcessoIntegracao;
  numero: 1 | 2 | 3 | 4;
  feriados?: string[];
  config: BootstrapState['config'];
  onSalvarProcesso: (processo: ProcessoIntegracao) => Promise<void> | void;
  onGerarBriefing: () => Promise<boolean | void> | boolean | void;
  onGerarWord: () => Promise<boolean | void> | boolean | void;
  processos?: ProcessoIntegracao[];
  onAbrirCadastroMentoras?: () => void;
  onAbrirBemTeste?: () => void;
}

async function copiarTexto(texto: string, sucesso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(sucesso);
  } catch {
    toast.error('Não foi possível copiar automaticamente.');
  }
}

function cloneHorarios(horarios: HorarioMentora[]): HorarioMentora[] {
  const lista = horarios.length ? horarios : [{ d: '', h: '' }, { d: '', h: '' }];
  return lista.map((x) => ({ d: x.d || '', h: x.h || '' }));
}

export function MentoraPreparacaoPainel({
  processo,
  numero,
  feriados = [],
  config,
  onSalvarProcesso,
  onGerarBriefing,
  onGerarWord,
  processos = [],
  onAbrirCadastroMentoras,
  onAbrirBemTeste,
}: MentoraPreparacaoPainelProps) {
  const mentora = mentoraVinculada(processo, config);
  const opcoesMentora = useMemo(() => mentorasAtivas(config), [config]);
  const estado = estadoMentoraAlinhamento(processo, numero);
  const checklist = checarPreparacaoMentora(processo, numero, config, feriados);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [mostrarBriefing, setMostrarBriefing] = useState(false);
  const [mensagemAberta, setMensagemAberta] = useState<'disp' | 'conf' | null>(null);
  const [dadosDirty, setDadosDirty] = useState(false);
  const [dadosDraft, setDadosDraft] = useState(() => ({
    tel: String(processo.tel || ''),
    gestorTel: String(processo.gestorTel || ''),
    statusPdi: String(processo.statusPdi || ''),
    bemQualidades: String(processo.bem?.qualidades || ''),
    testeResumo: String(processo.teste?.resumo || ''),
  }));
  const [horariosEditados, setHorariosEditados] = useState<HorarioMentora[]>(() => cloneHorarios(estado.hor));
  const [editandoHorarios, setEditandoHorarios] = useState(false);
  const [ecoPerfil, setEcoPerfil] = useState<EcoLiderPerfil | null>(() => (processo.teste as any)?.ecoPerfil || null);
  const [ecoAlunos, setEcoAlunos] = useState<EcoLiderAluno[]>([]);
  const [ecoStatus, setEcoStatus] = useState<'idle'|'carregando'|'automatico_seguro'|'manual'|'ambiguo'|'nao_encontrado'|'erro'>('idle');
  const [ecoErro, setEcoErro] = useState('');
  const [ecoSelecionado, setEcoSelecionado] = useState(String((processo.teste as any)?.ecoAlunoId || ''));
  const salvar = async (proximo: ProcessoIntegracao) => onSalvarProcesso(proximo);

  useEffect(() => {
    if (!editandoHorarios) setHorariosEditados(cloneHorarios(estado.hor));
    if (!dadosDirty) {
      setDadosDraft({
        tel: String(processo.tel || ''),
        gestorTel: String(processo.gestorTel || ''),
        statusPdi: String(processo.statusPdi || ''),
        bemQualidades: String(processo.bem?.qualidades || ''),
        testeResumo: String(processo.teste?.resumo || ''),
      });
    }
  }, [processo, numero, editandoHorarios, dadosDirty]);

  const sugestaoGestor = sugerirTelefoneGestorMentora(processo, processos);
  const disponibilidade = mensagemDisponibilidadeMentora(processo, numero, config, feriados);
  const confirmacao = mensagemConfirmacaoMentora(processo, numero, config);
  const linkDisponibilidade = linkWhatsAppMentora(mentora?.tel, disponibilidade);
  const linkConfirmacao = linkWhatsAppMentora(mentora?.tel, confirmacao);

  const statusChecklist = checklist.bloqueios
    ? `${checklist.bloqueios} dado${checklist.bloqueios === 1 ? '' : 's'} faltando`
    : checklist.avisos
      ? `${checklist.avisos} aviso${checklist.avisos === 1 ? '' : 's'}`
      : 'Tudo pronto';

  const alterarDado = (campo: keyof typeof dadosDraft, valor: string) => {
    setDadosDraft((atual) => ({ ...atual, [campo]: valor }));
    setDadosDirty(true);
  };

  const salvarDadosPreparacao = async () => {
    const proximo: ProcessoIntegracao = {
      ...processo,
      tel: dadosDraft.tel,
      gestorTel: dadosDraft.gestorTel,
      statusPdi: dadosDraft.statusPdi,
      bem: { ...(processo.bem || {}), qualidades: dadosDraft.bemQualidades },
      teste: { ...(processo.teste || {}), resumo: dadosDraft.testeResumo },
    };
    await salvar(proximo);
    setDadosDirty(false);
    toast.success('Dados da preparação salvos e conferidos.');
  };

  const mensagemTemPendencia = (texto: string) =>
    texto.includes('PREENCHA AQUI') || texto.includes('(data a') || texto.includes('(link a') || texto.includes('(horário a');

  const salvarHorarios = async () => {
    await salvar(substituirHorariosMentora(processo, numero, horariosEditados));
    setEditandoHorarios(false);
    toast.success('Horários da mentora salvos.');
  };

  const gerarBriefing = async () => {
    if (checklist.bloqueios) {
      setMostrarChecklist(true);
      toast.error('Há dados obrigatórios faltando. Confira antes de gerar o briefing.');
      return;
    }
    const gerado = await onGerarBriefing();
    if (gerado !== false) await salvar(marcarBriefingMentora(processo, numero));
  };

  const gerarWord = async () => {
    const gerado = await onGerarWord();
    if (gerado !== false) await salvar(marcarWordMentora(processo, numero));
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[240px] flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preparação da mentora</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={mentora?.id || ''}
              onChange={(e) => salvar(vincularMentoraProcesso(processo, e.target.value))}
              className="h-9 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Selecionar mentora"
            >
              <option value="">— escolher mentora —</option>
              {opcoesMentora.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            {mentora?.tel && <Badge variant="outline">{telefoneBonitoMentora(mentora.tel)}</Badge>}
            {mentora?.legado && <Badge variant="outline">cadastro antigo sem vínculo</Badge>}
          </div>
          {mentora && (
            <p className="mt-1 text-xs text-muted-foreground">
              {[mentora.email, mentora.tel ? telefoneBonitoMentora(mentora.tel) : ''].filter(Boolean).join(' · ') || 'Contato não informado'}
            </p>
          )}
          {(!opcoesMentora.length || (mentora && !mentora.tel)) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-amber-700">{!opcoesMentora.length ? 'Ainda não há mentoras ativas cadastradas nas configurações.' : 'Complete o telefone da mentora para abrir o WhatsApp diretamente.'}</p>
              {onAbrirCadastroMentoras && <Button type="button" size="sm" variant="ghost" onClick={onAbrirCadastroMentoras}>Abrir cadastro de mentoras</Button>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={checklist.bloqueios ? 'border-red-300 bg-red-50 text-red-800' : checklist.avisos ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}>
            {statusChecklist}
          </Badge>
          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarChecklist((v) => !v)}>
            Verificar dados
          </Button>
          <Badge variant="outline" className={estado.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''}>
            {estado.ok ? 'Preparação concluída' : 'Preparação em andamento'}
          </Badge>
        </div>
      </div>

      {mostrarChecklist && (
        <div className="overflow-hidden rounded-md border bg-background">
          <div className="border-b px-3 py-2 text-sm font-medium">Conferência dos dados para a mentora</div>
          <div className="divide-y">
            {checklist.itens.map((item) => (
              <div key={item.chave} className="flex gap-3 px-3 py-3 text-sm">
                <span className={item.nivel === 'ok' ? 'text-emerald-700' : item.nivel === 'bloq' ? 'text-red-700' : 'text-amber-700'}>
                  {item.nivel === 'ok' ? '✓' : item.nivel === 'bloq' ? '×' : '!'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground">{item.detalhe}</p>
                  {item.nivel !== 'ok' && item.campo === 'tel' && (
                    <input value={dadosDraft.tel} onChange={(e) => alterarDado('tel', e.target.value)} placeholder="(63) 90000-0000" className="mt-2 h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" />
                  )}
                  {item.nivel !== 'ok' && item.campo === 'gestorTel' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input value={dadosDraft.gestorTel} onChange={(e) => alterarDado('gestorTel', e.target.value)} placeholder="(63) 90000-0000" className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm" />
                      {sugestaoGestor && sugestaoGestor.de !== 'cadastro atual' && (
                        <Button type="button" size="sm" variant="outline" onClick={() => alterarDado('gestorTel', sugestaoGestor.tel)}>
                          Usar {telefoneBonitoMentora(sugestaoGestor.tel)}
                        </Button>
                      )}
                      {sugestaoGestor && sugestaoGestor.de !== 'cadastro atual' && <span className="text-[11px] text-muted-foreground">encontrado em {sugestaoGestor.de}</span>}
                    </div>
                  )}
                  {item.nivel !== 'ok' && item.campo === 'bem' && (
                    <div className="mt-2 space-y-2">
                      <textarea value={dadosDraft.bemQualidades} onChange={(e) => alterarDado('bemQualidades', e.target.value)} placeholder="qualidades e competências que o gestor considera necessárias" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                      {onAbrirBemTeste && <Button type="button" size="sm" variant="outline" onClick={onAbrirBemTeste}>Abrir Bem Acolhido e teste</Button>}
                    </div>
                  )}
                  {item.nivel !== 'ok' && item.campo === 'teste' && (
                    <textarea value={dadosDraft.testeResumo} onChange={(e) => alterarDado('testeResumo', e.target.value)} placeholder="resumo do teste comportamental / Avaliação de Potencial" className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  )}
                  {item.nivel !== 'ok' && item.campo === 'statusPdi' && (
                    <textarea value={dadosDraft.statusPdi} onChange={(e) => alterarDado('statusPdi', e.target.value)} placeholder="como está o PDI neste momento" className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  )}
                  {item.nivel !== 'ok' && item.campo === 'mentora' && onAbrirCadastroMentoras && (
                    <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onAbrirCadastroMentoras}>Completar cadastro da mentora</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {dadosDirty && (
            <div className="flex justify-end border-t px-3 py-3">
              <Button type="button" size="sm" onClick={() => void salvarDadosPreparacao()}>Salvar dados da preparação</Button>
            </div>
          )}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {checklist.bloqueios
              ? 'Dados obrigatórios faltando: o Briefing PDF fica bloqueado até a correção.'
              : checklist.avisos
                ? 'O material pode ser gerado; os avisos devem aparecer como pontos a confirmar, nunca como dados inventados.'
                : 'Material completo para preparação da reunião.'}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">1. Pedir disponibilidade</p>
          {estado.pedidoEm && <span className="text-xs text-muted-foreground">registrado em {estado.pedidoEm}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setMensagemAberta('disp')}>Ver mensagem</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => copiarTexto(disponibilidade, 'Mensagem de disponibilidade copiada.')}>Copiar mensagem</Button>
          {linkDisponibilidade && (
            <Button type="button" size="sm" variant="outline" onClick={() => window.open(linkDisponibilidade, '_blank', 'noopener,noreferrer')}>Abrir WhatsApp</Button>
          )}
          <Button type="button" size="sm" variant={estado.pedidoEm ? 'secondary' : 'default'} onClick={() => salvar(marcarPedidoDisponibilidadeMentora(processo, numero))}>
            {estado.pedidoEm ? 'Registrar novamente' : 'Marcar pedido enviado'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">2. Registrar horários recebidos</p>
          <span className="text-xs text-muted-foreground">Edite localmente e clique em Salvar; não grava a cada tecla.</span>
        </div>
        <div className="space-y-2">
          {horariosEditados.map((horario, indice) => (
            <div key={indice} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={horario.d}
                disabled={!editandoHorarios}
                onChange={(e) => setHorariosEditados((lista) => lista.map((x, i) => i === indice ? { ...x, d: e.target.value } : x))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-70"
                aria-label={`Data ${indice + 1} da mentora`}
              />
              <input
                value={horario.h}
                disabled={!editandoHorarios}
                onChange={(e) => setHorariosEditados((lista) => lista.map((x, i) => i === indice ? { ...x, h: e.target.value } : x))}
                className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-70"
                placeholder="09h, 14h, 16h30"
                aria-label={`Horário ${indice + 1} da mentora`}
              />
              {editandoHorarios && horariosEditados.length > 1 && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setHorariosEditados((lista) => lista.filter((_, i) => i !== indice))}>Remover</Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editandoHorarios ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditandoHorarios(true)}>Editar horários</Button>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => setHorariosEditados((lista) => [...lista, { d: '', h: '' }])}>+ linha</Button>
              <Button type="button" size="sm" onClick={salvarHorarios}>Salvar horários</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setHorariosEditados(cloneHorarios(estado.hor)); setEditandoHorarios(false); }}>Cancelar</Button>
            </>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => salvar(usarHorariosMentoraNoGestor(processo, numero))}>Usar horários no e-mail ao gestor</Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">3. Materiais da mentora</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={estado.briefEm ? 'secondary' : 'default'} disabled={Boolean(checklist.bloqueios)} onClick={gerarBriefing}>
            {estado.briefEm ? `Briefing PDF · ${estado.briefEm}` : 'Gerar Briefing PDF'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarBriefing(true)}>Ver prévia completa</Button>
          <Button type="button" size="sm" variant={estado.wordEm ? 'secondary' : 'outline'} onClick={gerarWord}>
            {estado.wordEm ? `Relatório Word · ${estado.wordEm}` : 'Gerar Relatório Word'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">4. Confirmar com a mentora</p>
          {estado.confirmEm && <span className="text-xs text-muted-foreground">registrado em {estado.confirmEm}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setMensagemAberta('conf')}>Ver mensagem</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => copiarTexto(confirmacao, 'Mensagem de confirmação copiada.')}>Copiar confirmação</Button>
          {linkConfirmacao && (
            <Button type="button" size="sm" variant="outline" onClick={() => window.open(linkConfirmacao, '_blank', 'noopener,noreferrer')}>Abrir WhatsApp</Button>
          )}
          <Button type="button" size="sm" variant={estado.confirmEm ? 'secondary' : 'default'} onClick={() => salvar(marcarConfirmacaoMentora(processo, numero))}>
            {estado.confirmEm ? 'Registrar novamente' : 'Marcar confirmação enviada'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground">Ao concluir a preparação, a ação ag{numero}-00 é fechada pelas mesmas automações históricas já portadas.</p>
        <Button type="button" size="sm" variant={estado.ok ? 'outline' : 'default'} onClick={() => salvar(alternarPreparacaoMentora(processo, numero))}>
          {estado.ok ? 'Reabrir preparação' : 'Concluir preparação da mentora'}
        </Button>
      </div>

      {mensagemAberta && (
        <div className="fixed inset-0 z-[85] grid place-items-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h4 className="font-semibold">WhatsApp — {mensagemAberta === 'conf' ? 'confirmação da reunião' : 'disponibilidade da mentora'}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{mentora?.nome || 'mentora sem cadastro'} · {numero}º alinhamento · {processo.nome}</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMensagemAberta(null)}>Fechar</Button>
            </div>
            {mensagemTemPendencia(mensagemAberta === 'conf' ? confirmacao : disponibilidade) && (
              <div className="border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Ainda há informação a confirmar na mensagem. Complete antes de enviar.</div>
            )}
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap p-5 text-sm font-sans">{mensagemAberta === 'conf' ? confirmacao : disponibilidade}</pre>
            <div className="flex flex-wrap justify-end gap-2 border-t p-4">
              <Button type="button" onClick={() => copiarTexto(mensagemAberta === 'conf' ? confirmacao : disponibilidade, 'Mensagem copiada.')}>Copiar mensagem</Button>
              {(mensagemAberta === 'conf' ? linkConfirmacao : linkDisponibilidade) && (
                <Button type="button" variant="secondary" onClick={() => window.open(mensagemAberta === 'conf' ? linkConfirmacao : linkDisponibilidade, '_blank', 'noopener,noreferrer')}>Abrir no WhatsApp</Button>
              )}
              <Button type="button" variant="outline" onClick={() => void salvar(mensagemAberta === 'conf' ? marcarConfirmacaoMentora(processo, numero) : marcarPedidoDisponibilidadeMentora(processo, numero))}>Marcar como enviada</Button>
              {mensagemAberta === 'disp' && <Button type="button" variant="outline" disabled={Boolean(checklist.bloqueios)} onClick={() => void gerarBriefing()}>Gerar briefing para anexar</Button>}
            </div>
          </div>
        </div>
      )}

      {mostrarBriefing && (
        <BriefingMentoraPreview
          processo={processo}
          numero={numero}
          config={config}
          feriados={feriados}
          onClose={() => setMostrarBriefing(false)}
          onGerarPdf={() => void gerarBriefing()}
          onGerarWord={() => void gerarWord()}
          onConferir={() => { setMostrarBriefing(false); setMostrarChecklist(true); }}
        />
      )}
    </div>
  );
}
