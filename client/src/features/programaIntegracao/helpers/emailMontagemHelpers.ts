import type { BootstrapState, ProcessoIntegracao } from '../types';
import {
  emailMarkdownParaTexto,
  emailTemDadoFaltante,
  montarEmailComModelo,
  type EmailMontadoIntegracao,
} from './emailCoreHelpers';
import { alinhamentoDoModeloEmail } from './emailAcaoHelpers';
import { valoresTokensLinksIntegracao } from './emailLinksHelpers';
import { modeloEmailIntegracao } from './emailModelosIntegracao';
import { AVISO_PADRAO_EMAIL_INTEGRACAO } from './emailModelosPadrao';
import { MARCADOR_EMAIL_VAZIO, valoresEmailIntegracao } from './emailValoresHelpers';

export interface MentoraConfigIntegracao {
  id?: string;
  nome?: string;
  tel?: string;
  email?: string;
  ativa?: boolean;
  obs?: string;
}

export interface EmailPreviewIntegracao {
  email: EmailMontadoIntegracao;
  faltandoDados: boolean;
  textoSimples: string;
  mailto: string;
}

function nomeMentoraDoProcesso(
  processo: ProcessoIntegracao,
  config: BootstrapState['config'],
): string {
  const mentoras = Array.isArray(config?.mentoras)
    ? config.mentoras as MentoraConfigIntegracao[]
    : [];

  if (processo.mentorId) {
    const vinculada = mentoras.find((m) => m?.id === processo.mentorId);
    if (vinculada?.nome) return String(vinculada.nome).trim();
  }

  // O HTML mantém `consultora` como legado quando ainda não existe vínculo por ID.
  return String(processo.consultora || '').trim();
}

function avisoDaConfiguracao(config: BootstrapState['config']): string {
  return config?.aviso == null
    ? AVISO_PADRAO_EMAIL_INTEGRACAO
    : String(config.aviso || '');
}

function valorSeguroMailto(valor: string): string {
  return valor && !valor.includes(MARCADOR_EMAIL_VAZIO) ? valor : '';
}

/**
 * Equivalente somente-leitura de `montar(k,p)` + preparação do diálogo de e-mail.
 * Não envia, não grava configuração e não altera o processo.
 */
export function montarPreviewEmailIntegracao(
  chave: string,
  processo: ProcessoIntegracao,
  config: BootstrapState['config'],
  feriados: string[] = [],
  origin?: string,
): EmailPreviewIntegracao | null {
  const modelo = modeloEmailIntegracao(chave, config?.emails || null);
  if (!modelo) return null;

  const linksPorToken = valoresTokensLinksIntegracao(config?.links || null, origin);
  const alinhamento = alinhamentoDoModeloEmail(chave);
  const aviso = avisoDaConfiguracao(config);
  const valores = valoresEmailIntegracao(processo, {
    alinhamento,
    feriados,
    mentoraNome: nomeMentoraDoProcesso(processo, config),
    linksPorToken,
    aviso,
  });

  const email = montarEmailComModelo(
    chave,
    modelo,
    valores,
    MARCADOR_EMAIL_VAZIO,
    aviso,
  );
  const textoSimples = emailMarkdownParaTexto(email.corpo);
  const para = valorSeguroMailto(email.para);
  const cc = valorSeguroMailto(email.cc);
  const mailto =
    `mailto:${encodeURIComponent(para)}` +
    `?subject=${encodeURIComponent(email.assunto)}` +
    `&body=${encodeURIComponent(textoSimples)}` +
    (cc ? `&cc=${encodeURIComponent(cc)}` : '');

  return {
    email,
    faltandoDados: emailTemDadoFaltante(email, MARCADOR_EMAIL_VAZIO),
    textoSimples,
    mailto,
  };
}

function escaparHtml(valor: string): string {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineHtml(texto: string, marcarVazio = true): string {
  let out = escaparHtml(texto).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  if (marcarVazio) {
    out = out.split(MARCADOR_EMAIL_VAZIO).join(`<mark>${MARCADOR_EMAIL_VAZIO}</mark>`);
  }
  return out;
}

function ehUrlIsolada(texto: string): boolean {
  return /^https?:\/\/\S+$/i.test(String(texto || '').trim());
}

function contextoIndicaFormulario(texto: string): boolean {
  const normalizado = String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return /formulario|pesquisa|preenchimento|bem acolhido|controle do programa|acompanhamento do pdi/.test(normalizado);
}

function linkFormularioHtml(url: string, rico: boolean): string {
  const seguro = escaparHtml(url.trim());
  if (rico) {
    return '<div style="margin:10px 0 16px;padding:12px 14px;background:#FFF3BF;border:1px solid #E7C94A;border-radius:8px">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#7A5A00;margin-bottom:5px">Link para preenchimento</div>' +
      '<a href="' + seguro + '" style="color:#233A73;font-weight:700;text-decoration:underline;word-break:break-all">' + seguro + '</a>' +
      '</div>';
  }
  return '<div class="email-form-link"><span>Link para preenchimento</span><a href="' + seguro + '" target="_blank" rel="noreferrer">' + seguro + '</a></div>';
}

function listaVisualPreview(linhas: string[]): string {
  return '<div class="email-lista-visual">' +
    linhas.map((linha) => '<div class="email-lista-card">' + inlineHtml(linha.replace(/^[-•]\s/, '')) + '</div>').join('') +
    '</div>';
}

function listaVisualRica(linhas: string[]): string {
  return '<div style="margin:2px 0 16px">' +
    linhas.map((linha) => '<div style="margin:0 0 7px;padding:9px 11px;background:#F7F8FC;border-left:3px solid #6B3E8F;border-radius:4px">' +
      inlineHtml(linha.replace(/^[-•]\s/, ''), false) + '</div>').join('') +
    '</div>';
}

/** Espelha `mdHtml(corpo)` do HTML histórico para a prévia na tela. */
export function emailMarkdownParaHtmlPreview(corpo: string): string {
  const blocos = String(corpo || '').split('\n\n');
  return blocos.map((bloco, indice) => {
    if (/^>\s?/.test(bloco)) {
      return `<p class="email-aviso">${inlineHtml(bloco.replace(/^>\s?/gm, ''))}</p>`;
    }
    if (bloco.trim() === '---') return '<hr class="email-regra">';
    const linhas = bloco.split('\n');
    if (linhas.every((linha) => /^[-•]\s/.test(linha))) return listaVisualPreview(linhas);

    return linhas.map((linha, linhaIndice) => {
      if (ehUrlIsolada(linha)) {
        const contexto = [
          blocos[indice - 1] || '',
          bloco,
          linhas[linhaIndice - 1] || '',
        ].join(' ');
        if (contextoIndicaFormulario(contexto)) return linkFormularioHtml(linha, false);
      }
      return `<p>${inlineHtml(linha)}</p>`;
    }).join('');
  }).join('');
}

export function emailMarkdownParaHtmlRico(corpo: string): string {
  const partes = String(corpo || '').split('\n\n');
  const blocos = partes.map((bloco, indice) => {
    const inline = (texto: string) => inlineHtml(texto, false);
    if (/^>\s?/.test(bloco)) {
      return '<div style="font-size:12.5px;color:#5B6675;border-left:3px solid #6B3E8F;padding:8px 12px;background:#F7F8FC;margin:0 0 16px">' +
        inline(bloco.replace(/^>\s?/gm, '')) + '</div>';
    }
    if (bloco.trim() === '---') {
      return '<hr style="border:0;border-top:1px solid #E8E3E0;margin:18px 0">';
    }
    const linhas = bloco.split('\n');
    if (linhas.every((linha) => /^[-•]\s/.test(linha))) return listaVisualRica(linhas);

    return linhas.map((linha, linhaIndice) => {
      if (ehUrlIsolada(linha)) {
        const contexto = [partes[indice - 1] || '', bloco, linhas[linhaIndice - 1] || ''].join(' ');
        if (contextoIndicaFormulario(contexto)) return linkFormularioHtml(linha, true);
      }
      return '<p style="margin:0 0 14px">' + inline(linha) + '</p>';
    }).join('');
  }).join('');

  return '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;color:#152232">' +
    '<div style="height:4px;background:linear-gradient(90deg,#3157A4,#6B3E8F);border-radius:6px 6px 0 0;margin-bottom:18px"></div>' +
    blocos +
    '</div>';
}
